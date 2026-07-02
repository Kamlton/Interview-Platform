namespace InterviewPlatform.Api.Features.PrintForms;

public interface IHtmlToPdfConverter
{
    Task<byte[]> ConvertAsync(string html, CancellationToken ct);
}
