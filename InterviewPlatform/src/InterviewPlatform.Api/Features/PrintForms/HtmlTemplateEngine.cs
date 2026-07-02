using System.Net;
using System.Text.RegularExpressions;

namespace InterviewPlatform.Api.Features.PrintForms;

public static partial class HtmlTemplateEngine
{
    [GeneratedRegex(@"\{\{\{(\w+)\}\}\}")] private static partial Regex RawToken();
    [GeneratedRegex(@"\{\{(\w+)\}\}")]     private static partial Regex EscToken();

    public static string Render(string template, IReadOnlyDictionary<string, string> data)
    {
        var s = RawToken().Replace(template, m => data.TryGetValue(m.Groups[1].Value, out var v) ? v : "");
        s = EscToken().Replace(s, m => data.TryGetValue(m.Groups[1].Value, out var v) ? WebUtility.HtmlEncode(v) : "");
        return s;
    }
}
