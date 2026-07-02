using FluentAssertions;
using InterviewPlatform.Api.Features.PrintForms;
using Xunit;

namespace InterviewPlatform.Api.Tests.Unit;

public class HtmlTemplateEngineTests
{
    [Fact]
    public void Escaped_token_is_html_encoded()
    {
        var html = HtmlTemplateEngine.Render("Имя: {{Name}}", new Dictionary<string, string> { ["Name"] = "<b>" });
        html.Should().Be("Имя: &lt;b&gt;");
    }

    [Fact]
    public void Raw_token_is_inserted_as_is()
    {
        var html = HtmlTemplateEngine.Render("<tbody>{{{Rows}}}</tbody>",
            new Dictionary<string, string> { ["Rows"] = "<tr><td>x</td></tr>" });
        html.Should().Be("<tbody><tr><td>x</td></tr></tbody>");
    }

    [Fact]
    public void Missing_token_becomes_empty()
    {
        HtmlTemplateEngine.Render("a{{X}}b", new Dictionary<string, string>()).Should().Be("ab");
    }
}
