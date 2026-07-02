using System;
using InterviewPlatform.Api.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace InterviewPlatform.Api.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260630135538_InitialCreate")]
    partial class InitialCreate
    {
        protected override void BuildTargetModel(ModelBuilder modelBuilder)
        {
#pragma warning disable 612, 618
            modelBuilder
                .HasAnnotation("ProductVersion", "10.0.0")
                .HasAnnotation("Relational:MaxIdentifierLength", 63);

            NpgsqlModelBuilderExtensions.UseIdentityByDefaultColumns(modelBuilder);

            modelBuilder.Entity("InterviewPlatform.Api.Domain.Entities.AuditLog", b =>
                {
                    b.Property<Guid>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("uuid");

                    b.Property<string>("Action")
                        .IsRequired()
                        .HasMaxLength(50)
                        .HasColumnType("character varying(50)");

                    b.Property<DateTimeOffset>("ChangedAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<Guid?>("ChangedByUserId")
                        .HasColumnType("uuid");

                    b.Property<string>("Details")
                        .HasColumnType("text");

                    b.Property<Guid>("EntityId")
                        .HasColumnType("uuid");

                    b.Property<string>("EntityType")
                        .IsRequired()
                        .HasMaxLength(100)
                        .HasColumnType("character varying(100)");

                    b.HasKey("Id");

                    b.HasIndex("EntityType", "EntityId");

                    b.ToTable("AuditLogs");
                });

            modelBuilder.Entity("InterviewPlatform.Api.Domain.Entities.Candidate", b =>
                {
                    b.Property<Guid>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("uuid");

                    b.Property<string>("City")
                        .HasColumnType("text");

                    b.Property<DateTimeOffset>("CreatedAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<Guid>("CreatedByUserId")
                        .HasColumnType("uuid");

                    b.Property<string>("Education")
                        .HasColumnType("text");

                    b.Property<string>("FullName")
                        .IsRequired()
                        .HasMaxLength(200)
                        .HasColumnType("character varying(200)");

                    b.Property<bool>("IsArchived")
                        .HasColumnType("boolean");

                    b.Property<string>("Phone")
                        .HasColumnType("text");

                    b.Property<string>("PreviousWorkplace")
                        .HasColumnType("text");

                    b.Property<string>("Status")
                        .IsRequired()
                        .HasMaxLength(30)
                        .HasColumnType("character varying(30)");

                    b.HasKey("Id");

                    b.HasIndex("CreatedByUserId");

                    b.HasIndex("FullName");

                    b.ToTable("Candidates");
                });

            modelBuilder.Entity("InterviewPlatform.Api.Domain.Entities.CandidateSkill", b =>
                {
                    b.Property<Guid>("CandidateId")
                        .HasColumnType("uuid");

                    b.Property<Guid>("SkillId")
                        .HasColumnType("uuid");

                    b.HasKey("CandidateId", "SkillId");

                    b.HasIndex("SkillId");

                    b.ToTable("CandidateSkills");
                });

            modelBuilder.Entity("InterviewPlatform.Api.Domain.Entities.Competency", b =>
                {
                    b.Property<Guid>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("uuid");

                    b.Property<string>("Category")
                        .HasColumnType("text");

                    b.Property<string>("Description")
                        .HasColumnType("text");

                    b.Property<string>("Name")
                        .IsRequired()
                        .HasMaxLength(200)
                        .HasColumnType("character varying(200)");

                    b.HasKey("Id");

                    b.ToTable("Competencies");
                });

            modelBuilder.Entity("InterviewPlatform.Api.Domain.Entities.CompetencyMatrix", b =>
                {
                    b.Property<Guid>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("uuid");

                    b.Property<DateTimeOffset>("CreatedAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<Guid>("CreatedByUserId")
                        .HasColumnType("uuid");

                    b.Property<string>("Title")
                        .IsRequired()
                        .HasMaxLength(200)
                        .HasColumnType("character varying(200)");

                    b.Property<Guid?>("VacancyId")
                        .HasColumnType("uuid");

                    b.HasKey("Id");

                    b.HasIndex("CreatedByUserId");

                    b.HasIndex("VacancyId");

                    b.ToTable("CompetencyMatrices");
                });

            modelBuilder.Entity("InterviewPlatform.Api.Domain.Entities.CompetencyScore", b =>
                {
                    b.Property<Guid>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("uuid");

                    b.Property<string>("Comment")
                        .HasColumnType("text");

                    b.Property<Guid>("CompetencyId")
                        .HasColumnType("uuid");

                    b.Property<Guid>("InterviewId")
                        .HasColumnType("uuid");

                    b.Property<int>("Score")
                        .HasColumnType("integer");

                    b.HasKey("Id");

                    b.HasIndex("CompetencyId");

                    b.HasIndex("InterviewId", "CompetencyId")
                        .IsUnique();

                    b.ToTable("CompetencyScores");
                });

            modelBuilder.Entity("InterviewPlatform.Api.Domain.Entities.Decision", b =>
                {
                    b.Property<Guid>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("uuid");

                    b.Property<string>("Comment")
                        .HasColumnType("text");

                    b.Property<DateTimeOffset>("DecidedAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<string>("DecisionType")
                        .IsRequired()
                        .HasMaxLength(20)
                        .HasColumnType("character varying(20)");

                    b.Property<Guid>("InterviewId")
                        .HasColumnType("uuid");

                    b.Property<Guid>("MadeByUserId")
                        .HasColumnType("uuid");

                    b.HasKey("Id");

                    b.HasIndex("InterviewId")
                        .IsUnique();

                    b.HasIndex("MadeByUserId");

                    b.ToTable("Decisions");
                });

            modelBuilder.Entity("InterviewPlatform.Api.Domain.Entities.DocumentTemplate", b =>
                {
                    b.Property<Guid>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("uuid");

                    b.Property<string>("HtmlBody")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<string>("Name")
                        .IsRequired()
                        .HasMaxLength(200)
                        .HasColumnType("character varying(200)");

                    b.Property<string>("Type")
                        .IsRequired()
                        .HasMaxLength(30)
                        .HasColumnType("character varying(30)");

                    b.HasKey("Id");

                    b.ToTable("DocumentTemplates");
                });

            modelBuilder.Entity("InterviewPlatform.Api.Domain.Entities.GeneratedDocument", b =>
                {
                    b.Property<Guid>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("uuid");

                    b.Property<Guid?>("CandidateId")
                        .HasColumnType("uuid");

                    b.Property<string>("FileName")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<DateTimeOffset>("GeneratedAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<Guid>("GeneratedByUserId")
                        .HasColumnType("uuid");

                    b.Property<Guid?>("InterviewId")
                        .HasColumnType("uuid");

                    b.Property<Guid>("TemplateId")
                        .HasColumnType("uuid");

                    b.Property<string>("Type")
                        .IsRequired()
                        .HasMaxLength(30)
                        .HasColumnType("character varying(30)");

                    b.HasKey("Id");

                    b.HasIndex("InterviewId");

                    b.HasIndex("TemplateId");

                    b.ToTable("GeneratedDocuments");
                });

            modelBuilder.Entity("InterviewPlatform.Api.Domain.Entities.Interview", b =>
                {
                    b.Property<Guid>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("uuid");

                    b.Property<Guid>("CandidateId")
                        .HasColumnType("uuid");

                    b.Property<DateTimeOffset>("CreatedAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<Guid>("InterviewerUserId")
                        .HasColumnType("uuid");

                    b.Property<bool>("IsArchived")
                        .HasColumnType("boolean");

                    b.Property<Guid?>("MatrixId")
                        .HasColumnType("uuid");

                    b.Property<string>("Plan")
                        .HasColumnType("text");

                    b.Property<DateTimeOffset>("ScheduledAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<string>("Status")
                        .IsRequired()
                        .HasMaxLength(30)
                        .HasColumnType("character varying(30)");

                    b.Property<string>("Summary")
                        .HasColumnType("text");

                    b.Property<Guid>("VacancyId")
                        .HasColumnType("uuid");

                    b.HasKey("Id");

                    b.HasIndex("CandidateId");

                    b.HasIndex("InterviewerUserId");

                    b.HasIndex("MatrixId");

                    b.HasIndex("VacancyId");

                    b.ToTable("Interviews");
                });

            modelBuilder.Entity("InterviewPlatform.Api.Domain.Entities.MatrixCompetency", b =>
                {
                    b.Property<Guid>("MatrixId")
                        .HasColumnType("uuid");

                    b.Property<Guid>("CompetencyId")
                        .HasColumnType("uuid");

                    b.Property<int>("Weight")
                        .HasColumnType("integer");

                    b.HasKey("MatrixId", "CompetencyId");

                    b.HasIndex("CompetencyId");

                    b.ToTable("MatrixCompetencies");
                });

            modelBuilder.Entity("InterviewPlatform.Api.Domain.Entities.Permission", b =>
                {
                    b.Property<Guid>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("uuid");

                    b.Property<string>("Code")
                        .IsRequired()
                        .HasMaxLength(100)
                        .HasColumnType("character varying(100)");

                    b.Property<string>("Name")
                        .IsRequired()
                        .HasColumnType("text");

                    b.HasKey("Id");

                    b.HasIndex("Code")
                        .IsUnique();

                    b.ToTable("Permissions");
                });

            modelBuilder.Entity("InterviewPlatform.Api.Domain.Entities.RefreshToken", b =>
                {
                    b.Property<Guid>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("uuid");

                    b.Property<DateTimeOffset>("CreatedAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<DateTimeOffset>("ExpiresAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<DateTimeOffset?>("RevokedAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<string>("TokenHash")
                        .IsRequired()
                        .HasMaxLength(128)
                        .HasColumnType("character varying(128)");

                    b.Property<Guid>("UserId")
                        .HasColumnType("uuid");

                    b.HasKey("Id");

                    b.HasIndex("TokenHash")
                        .IsUnique();

                    b.HasIndex("UserId");

                    b.ToTable("RefreshTokens");
                });

            modelBuilder.Entity("InterviewPlatform.Api.Domain.Entities.Role", b =>
                {
                    b.Property<Guid>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("uuid");

                    b.Property<string>("Description")
                        .HasColumnType("text");

                    b.Property<string>("Name")
                        .IsRequired()
                        .HasMaxLength(100)
                        .HasColumnType("character varying(100)");

                    b.HasKey("Id");

                    b.HasIndex("Name")
                        .IsUnique();

                    b.ToTable("Roles");
                });

            modelBuilder.Entity("InterviewPlatform.Api.Domain.Entities.RolePermission", b =>
                {
                    b.Property<Guid>("RoleId")
                        .HasColumnType("uuid");

                    b.Property<Guid>("PermissionId")
                        .HasColumnType("uuid");

                    b.HasKey("RoleId", "PermissionId");

                    b.HasIndex("PermissionId");

                    b.ToTable("RolePermissions");
                });

            modelBuilder.Entity("InterviewPlatform.Api.Domain.Entities.Skill", b =>
                {
                    b.Property<Guid>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("uuid");

                    b.Property<string>("Name")
                        .IsRequired()
                        .HasMaxLength(100)
                        .HasColumnType("character varying(100)");

                    b.HasKey("Id");

                    b.HasIndex("Name")
                        .IsUnique();

                    b.ToTable("Skills");
                });

            modelBuilder.Entity("InterviewPlatform.Api.Domain.Entities.User", b =>
                {
                    b.Property<Guid>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("uuid");

                    b.Property<DateTimeOffset>("CreatedAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<string>("Email")
                        .IsRequired()
                        .HasMaxLength(256)
                        .HasColumnType("character varying(256)");

                    b.Property<string>("FullName")
                        .IsRequired()
                        .HasMaxLength(200)
                        .HasColumnType("character varying(200)");

                    b.Property<bool>("IsActive")
                        .HasColumnType("boolean");

                    b.Property<string>("PasswordHash")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<Guid>("RoleId")
                        .HasColumnType("uuid");

                    b.HasKey("Id");

                    b.HasIndex("Email")
                        .IsUnique();

                    b.HasIndex("RoleId");

                    b.ToTable("Users");
                });

            modelBuilder.Entity("InterviewPlatform.Api.Domain.Entities.Vacancy", b =>
                {
                    b.Property<Guid>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("uuid");

                    b.Property<DateTimeOffset>("CreatedAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<string>("Description")
                        .HasColumnType("text");

                    b.Property<bool>("IsArchived")
                        .HasColumnType("boolean");

                    b.Property<string>("Status")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<string>("Title")
                        .IsRequired()
                        .HasMaxLength(200)
                        .HasColumnType("character varying(200)");

                    b.HasKey("Id");

                    b.ToTable("Vacancies");
                });

            modelBuilder.Entity("InterviewPlatform.Api.Domain.Entities.Candidate", b =>
                {
                    b.HasOne("InterviewPlatform.Api.Domain.Entities.User", "CreatedBy")
                        .WithMany()
                        .HasForeignKey("CreatedByUserId")
                        .OnDelete(DeleteBehavior.Restrict)
                        .IsRequired();

                    b.Navigation("CreatedBy");
                });

            modelBuilder.Entity("InterviewPlatform.Api.Domain.Entities.CandidateSkill", b =>
                {
                    b.HasOne("InterviewPlatform.Api.Domain.Entities.Candidate", "Candidate")
                        .WithMany("CandidateSkills")
                        .HasForeignKey("CandidateId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.HasOne("InterviewPlatform.Api.Domain.Entities.Skill", "Skill")
                        .WithMany("CandidateSkills")
                        .HasForeignKey("SkillId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.Navigation("Candidate");

                    b.Navigation("Skill");
                });

            modelBuilder.Entity("InterviewPlatform.Api.Domain.Entities.CompetencyMatrix", b =>
                {
                    b.HasOne("InterviewPlatform.Api.Domain.Entities.User", "CreatedBy")
                        .WithMany()
                        .HasForeignKey("CreatedByUserId")
                        .OnDelete(DeleteBehavior.Restrict)
                        .IsRequired();

                    b.HasOne("InterviewPlatform.Api.Domain.Entities.Vacancy", "Vacancy")
                        .WithMany("Matrices")
                        .HasForeignKey("VacancyId")
                        .OnDelete(DeleteBehavior.SetNull);

                    b.Navigation("CreatedBy");

                    b.Navigation("Vacancy");
                });

            modelBuilder.Entity("InterviewPlatform.Api.Domain.Entities.CompetencyScore", b =>
                {
                    b.HasOne("InterviewPlatform.Api.Domain.Entities.Competency", "Competency")
                        .WithMany("Scores")
                        .HasForeignKey("CompetencyId")
                        .OnDelete(DeleteBehavior.Restrict)
                        .IsRequired();

                    b.HasOne("InterviewPlatform.Api.Domain.Entities.Interview", "Interview")
                        .WithMany("Scores")
                        .HasForeignKey("InterviewId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.Navigation("Competency");

                    b.Navigation("Interview");
                });

            modelBuilder.Entity("InterviewPlatform.Api.Domain.Entities.Decision", b =>
                {
                    b.HasOne("InterviewPlatform.Api.Domain.Entities.Interview", "Interview")
                        .WithOne("Decision")
                        .HasForeignKey("InterviewPlatform.Api.Domain.Entities.Decision", "InterviewId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.HasOne("InterviewPlatform.Api.Domain.Entities.User", "MadeBy")
                        .WithMany()
                        .HasForeignKey("MadeByUserId")
                        .OnDelete(DeleteBehavior.Restrict)
                        .IsRequired();

                    b.Navigation("Interview");

                    b.Navigation("MadeBy");
                });

            modelBuilder.Entity("InterviewPlatform.Api.Domain.Entities.GeneratedDocument", b =>
                {
                    b.HasOne("InterviewPlatform.Api.Domain.Entities.Interview", "Interview")
                        .WithMany("GeneratedDocuments")
                        .HasForeignKey("InterviewId")
                        .OnDelete(DeleteBehavior.SetNull);

                    b.HasOne("InterviewPlatform.Api.Domain.Entities.DocumentTemplate", "Template")
                        .WithMany("GeneratedDocuments")
                        .HasForeignKey("TemplateId")
                        .OnDelete(DeleteBehavior.Restrict)
                        .IsRequired();

                    b.Navigation("Interview");

                    b.Navigation("Template");
                });

            modelBuilder.Entity("InterviewPlatform.Api.Domain.Entities.Interview", b =>
                {
                    b.HasOne("InterviewPlatform.Api.Domain.Entities.Candidate", "Candidate")
                        .WithMany("Interviews")
                        .HasForeignKey("CandidateId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.HasOne("InterviewPlatform.Api.Domain.Entities.User", "Interviewer")
                        .WithMany()
                        .HasForeignKey("InterviewerUserId")
                        .OnDelete(DeleteBehavior.Restrict)
                        .IsRequired();

                    b.HasOne("InterviewPlatform.Api.Domain.Entities.CompetencyMatrix", "Matrix")
                        .WithMany("Interviews")
                        .HasForeignKey("MatrixId")
                        .OnDelete(DeleteBehavior.SetNull);

                    b.HasOne("InterviewPlatform.Api.Domain.Entities.Vacancy", "Vacancy")
                        .WithMany("Interviews")
                        .HasForeignKey("VacancyId")
                        .OnDelete(DeleteBehavior.Restrict)
                        .IsRequired();

                    b.Navigation("Candidate");

                    b.Navigation("Interviewer");

                    b.Navigation("Matrix");

                    b.Navigation("Vacancy");
                });

            modelBuilder.Entity("InterviewPlatform.Api.Domain.Entities.MatrixCompetency", b =>
                {
                    b.HasOne("InterviewPlatform.Api.Domain.Entities.Competency", "Competency")
                        .WithMany("MatrixCompetencies")
                        .HasForeignKey("CompetencyId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.HasOne("InterviewPlatform.Api.Domain.Entities.CompetencyMatrix", "Matrix")
                        .WithMany("Items")
                        .HasForeignKey("MatrixId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.Navigation("Competency");

                    b.Navigation("Matrix");
                });

            modelBuilder.Entity("InterviewPlatform.Api.Domain.Entities.RefreshToken", b =>
                {
                    b.HasOne("InterviewPlatform.Api.Domain.Entities.User", "User")
                        .WithMany()
                        .HasForeignKey("UserId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.Navigation("User");
                });

            modelBuilder.Entity("InterviewPlatform.Api.Domain.Entities.RolePermission", b =>
                {
                    b.HasOne("InterviewPlatform.Api.Domain.Entities.Permission", "Permission")
                        .WithMany("RolePermissions")
                        .HasForeignKey("PermissionId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.HasOne("InterviewPlatform.Api.Domain.Entities.Role", "Role")
                        .WithMany("RolePermissions")
                        .HasForeignKey("RoleId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.Navigation("Permission");

                    b.Navigation("Role");
                });

            modelBuilder.Entity("InterviewPlatform.Api.Domain.Entities.User", b =>
                {
                    b.HasOne("InterviewPlatform.Api.Domain.Entities.Role", "Role")
                        .WithMany("Users")
                        .HasForeignKey("RoleId")
                        .OnDelete(DeleteBehavior.Restrict)
                        .IsRequired();

                    b.Navigation("Role");
                });

            modelBuilder.Entity("InterviewPlatform.Api.Domain.Entities.Candidate", b =>
                {
                    b.Navigation("CandidateSkills");

                    b.Navigation("Interviews");
                });

            modelBuilder.Entity("InterviewPlatform.Api.Domain.Entities.Competency", b =>
                {
                    b.Navigation("MatrixCompetencies");

                    b.Navigation("Scores");
                });

            modelBuilder.Entity("InterviewPlatform.Api.Domain.Entities.CompetencyMatrix", b =>
                {
                    b.Navigation("Interviews");

                    b.Navigation("Items");
                });

            modelBuilder.Entity("InterviewPlatform.Api.Domain.Entities.DocumentTemplate", b =>
                {
                    b.Navigation("GeneratedDocuments");
                });

            modelBuilder.Entity("InterviewPlatform.Api.Domain.Entities.Interview", b =>
                {
                    b.Navigation("Decision");

                    b.Navigation("GeneratedDocuments");

                    b.Navigation("Scores");
                });

            modelBuilder.Entity("InterviewPlatform.Api.Domain.Entities.Permission", b =>
                {
                    b.Navigation("RolePermissions");
                });

            modelBuilder.Entity("InterviewPlatform.Api.Domain.Entities.Role", b =>
                {
                    b.Navigation("RolePermissions");

                    b.Navigation("Users");
                });

            modelBuilder.Entity("InterviewPlatform.Api.Domain.Entities.Skill", b =>
                {
                    b.Navigation("CandidateSkills");
                });

            modelBuilder.Entity("InterviewPlatform.Api.Domain.Entities.Vacancy", b =>
                {
                    b.Navigation("Interviews");

                    b.Navigation("Matrices");
                });
#pragma warning restore 612, 618
        }
    }
}
