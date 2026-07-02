namespace InterviewPlatform.Api.Common;

public class PageQuery
{
    private const int MaxSize = 100;
    private int _size = 20;
    public int Page { get; set; } = 1;
    public int Size { get => _size; set => _size = value is < 1 or > MaxSize ? 20 : value; }
    public string? Search { get; set; }
    public int Skip => (Math.Max(Page, 1) - 1) * Size;
}

public record PagedResult<T>(IReadOnlyList<T> Items, int Total, int Page, int Size)
{
    public int TotalPages => (int)Math.Ceiling(Total / (double)Size);
}
