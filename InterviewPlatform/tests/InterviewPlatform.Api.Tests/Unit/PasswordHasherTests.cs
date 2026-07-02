using FluentAssertions;
using InterviewPlatform.Api.Auth;
using Xunit;

namespace InterviewPlatform.Api.Tests.Unit;

public class PasswordHasherTests
{
    private readonly IPasswordHasher _hasher = new Pbkdf2PasswordHasher();

    [Fact]
    public void Hash_then_Verify_succeeds()
    {
        var hash = _hasher.Hash("S3cret!");
        _hasher.Verify("S3cret!", hash).Should().BeTrue();
    }

    [Fact]
    public void Verify_fails_for_wrong_password()
    {
        var hash = _hasher.Hash("S3cret!");
        _hasher.Verify("wrong", hash).Should().BeFalse();
    }

    [Fact]
    public void Hash_is_salted_each_time()
    {
        _hasher.Hash("same").Should().NotBe(_hasher.Hash("same"));
    }
}
