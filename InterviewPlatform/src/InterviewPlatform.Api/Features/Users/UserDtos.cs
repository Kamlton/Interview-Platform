namespace InterviewPlatform.Api.Features.Users;

public record CreateUserRequest(string FullName, string Email, string Password, string Role);
public record UserDto(Guid Id, string FullName, string Email, string Role, bool IsActive);
