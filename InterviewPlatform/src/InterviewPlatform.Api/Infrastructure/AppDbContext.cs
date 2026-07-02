using InterviewPlatform.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace InterviewPlatform.Api.Infrastructure;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<Permission> Permissions => Set<Permission>();
    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Candidate> Candidates => Set<Candidate>();
    public DbSet<Skill> Skills => Set<Skill>();
    public DbSet<CandidateSkill> CandidateSkills => Set<CandidateSkill>();
    public DbSet<Vacancy> Vacancies => Set<Vacancy>();
    public DbSet<Interview> Interviews => Set<Interview>();
    public DbSet<Competency> Competencies => Set<Competency>();
    public DbSet<CompetencyMatrix> CompetencyMatrices => Set<CompetencyMatrix>();
    public DbSet<MatrixCompetency> MatrixCompetencies => Set<MatrixCompetency>();
    public DbSet<CompetencyScore> CompetencyScores => Set<CompetencyScore>();
    public DbSet<Decision> Decisions => Set<Decision>();
    public DbSet<DocumentTemplate> DocumentTemplates => Set<DocumentTemplate>();
    public DbSet<GeneratedDocument> GeneratedDocuments => Set<GeneratedDocument>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<Role>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).HasMaxLength(100).IsRequired();
            e.HasIndex(x => x.Name).IsUnique();
        });
        b.Entity<Permission>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Code).HasMaxLength(100).IsRequired();
            e.HasIndex(x => x.Code).IsUnique();
        });
        b.Entity<RolePermission>(e =>
        {
            e.HasKey(x => new { x.RoleId, x.PermissionId });
            e.HasOne(x => x.Role).WithMany(r => r.RolePermissions).HasForeignKey(x => x.RoleId);
            e.HasOne(x => x.Permission).WithMany(p => p.RolePermissions).HasForeignKey(x => x.PermissionId);
        });

        b.Entity<User>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.FullName).HasMaxLength(200).IsRequired();
            e.Property(x => x.Email).HasMaxLength(256).IsRequired();
            e.HasIndex(x => x.Email).IsUnique();
            e.HasOne(x => x.Role).WithMany(r => r.Users).HasForeignKey(x => x.RoleId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        b.Entity<Candidate>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.FullName).HasMaxLength(200).IsRequired();
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(30);
            e.HasOne(x => x.CreatedBy).WithMany().HasForeignKey(x => x.CreatedByUserId)
             .OnDelete(DeleteBehavior.Restrict);
            e.HasIndex(x => x.FullName);
        });
        b.Entity<Skill>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).HasMaxLength(100).IsRequired();
            e.HasIndex(x => x.Name).IsUnique();
        });
        b.Entity<CandidateSkill>(e =>
        {
            e.HasKey(x => new { x.CandidateId, x.SkillId });
            e.HasOne(x => x.Candidate).WithMany(c => c.CandidateSkills).HasForeignKey(x => x.CandidateId);
            e.HasOne(x => x.Skill).WithMany(s => s.CandidateSkills).HasForeignKey(x => x.SkillId);
        });

        b.Entity<Vacancy>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Title).HasMaxLength(200).IsRequired();
        });

        b.Entity<Competency>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).HasMaxLength(200).IsRequired();
        });
        b.Entity<CompetencyMatrix>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Title).HasMaxLength(200).IsRequired();
            e.HasOne(x => x.Vacancy).WithMany(v => v.Matrices).HasForeignKey(x => x.VacancyId)
             .OnDelete(DeleteBehavior.SetNull);
            e.HasOne(x => x.CreatedBy).WithMany().HasForeignKey(x => x.CreatedByUserId)
             .OnDelete(DeleteBehavior.Restrict);
        });
        b.Entity<MatrixCompetency>(e =>
        {
            e.HasKey(x => new { x.MatrixId, x.CompetencyId });
            e.HasOne(x => x.Matrix).WithMany(m => m.Items).HasForeignKey(x => x.MatrixId);
            e.HasOne(x => x.Competency).WithMany(c => c.MatrixCompetencies).HasForeignKey(x => x.CompetencyId);
        });

        b.Entity<Interview>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(30);
            e.HasOne(x => x.Candidate).WithMany(c => c.Interviews).HasForeignKey(x => x.CandidateId)
             .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Vacancy).WithMany(v => v.Interviews).HasForeignKey(x => x.VacancyId)
             .OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Interviewer).WithMany().HasForeignKey(x => x.InterviewerUserId)
             .OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Matrix).WithMany(m => m.Interviews).HasForeignKey(x => x.MatrixId)
             .OnDelete(DeleteBehavior.SetNull);
        });

        b.Entity<CompetencyScore>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.InterviewId, x.CompetencyId }).IsUnique();
            e.HasOne(x => x.Interview).WithMany(i => i.Scores).HasForeignKey(x => x.InterviewId)
             .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Competency).WithMany(c => c.Scores).HasForeignKey(x => x.CompetencyId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        b.Entity<Decision>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.DecisionType).HasConversion<string>().HasMaxLength(20);
            e.HasIndex(x => x.InterviewId).IsUnique();
            e.HasOne(x => x.Interview).WithOne(i => i.Decision).HasForeignKey<Decision>(x => x.InterviewId)
             .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.MadeBy).WithMany().HasForeignKey(x => x.MadeByUserId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        b.Entity<DocumentTemplate>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Type).HasConversion<string>().HasMaxLength(30);
            e.Property(x => x.Name).HasMaxLength(200).IsRequired();
        });
        b.Entity<GeneratedDocument>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Type).HasConversion<string>().HasMaxLength(30);
            e.HasOne(x => x.Template).WithMany(t => t.GeneratedDocuments).HasForeignKey(x => x.TemplateId)
             .OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Interview).WithMany(i => i.GeneratedDocuments).HasForeignKey(x => x.InterviewId)
             .OnDelete(DeleteBehavior.SetNull);
        });

        b.Entity<AuditLog>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.EntityType).HasMaxLength(100).IsRequired();
            e.Property(x => x.Action).HasMaxLength(50).IsRequired();
            e.HasIndex(x => new { x.EntityType, x.EntityId });
        });

        b.Entity<RefreshToken>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.TokenHash).HasMaxLength(128).IsRequired();
            e.HasIndex(x => x.TokenHash).IsUnique();
            e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId)
             .OnDelete(DeleteBehavior.Cascade);
            e.Ignore(x => x.IsActive);
        });
    }
}
