using PuppeteerSharp;
using PuppeteerSharp.Media;

namespace InterviewPlatform.Api.Features.PrintForms;

public sealed class PuppeteerHtmlToPdfConverter : IHtmlToPdfConverter, IAsyncDisposable
{
    private readonly SemaphoreSlim _gate = new(1, 1);
    private readonly string? _cachePath;
    private IBrowser? _browser;

    public PuppeteerHtmlToPdfConverter(IConfiguration config) =>
        _cachePath = config["PrintForms:ChromiumCachePath"];

    private async Task<IBrowser> GetBrowserAsync()
    {
        if (_browser is { IsClosed: false }) return _browser;
        await _gate.WaitAsync();
        try
        {
            if (_browser is { IsClosed: false }) return _browser;
            var options = new BrowserFetcherOptions();
            if (!string.IsNullOrWhiteSpace(_cachePath)) options.Path = _cachePath;
            await new BrowserFetcher(options).DownloadAsync();
            _browser = await Puppeteer.LaunchAsync(new LaunchOptions
            {
                Headless = true,
                Args = new[] { "--no-sandbox", "--disable-setuid-sandbox" },
            });
            return _browser;
        }
        finally { _gate.Release(); }
    }

    public async Task<byte[]> ConvertAsync(string html, CancellationToken ct)
    {
        var browser = await GetBrowserAsync();
        await using var page = await browser.NewPageAsync();
        await page.SetContentAsync(html, new NavigationOptions
        {
            WaitUntil = new[] { WaitUntilNavigation.Networkidle0 },
        });
        return await page.PdfDataAsync(new PdfOptions
        {
            Format = PaperFormat.A4,
            PrintBackground = true,
            MarginOptions = new MarginOptions { Top = "20mm", Bottom = "20mm", Left = "18mm", Right = "18mm" },
        });
    }

    public async ValueTask DisposeAsync()
    {
        if (_browser is not null) await _browser.DisposeAsync();
        _gate.Dispose();
    }
}
