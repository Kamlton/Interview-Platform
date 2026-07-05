namespace InterviewPlatform.Api.Features.Users;
using System.ComponentModel.DataAnnotations;

public record CreateUserRequest(
    string FullName,
    
    [EmailAddress(ErrorMessage = "Неверный формат E-mail.")] 
    string Email,
    
    [RegularExpression(@"^(?=.*[A-ZА-Я])(?=.*[a-zа-я])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':""\\|,.<>\/?]).{6,}$", 
        ErrorMessage = "Пароль должен содержать заглавные и строчные буквы, цифры и спецсимволы.")]
    string Password,
    
    string Role
    );
public record UserDto(Guid Id, string FullName, string Email, string Role, bool IsActive);
