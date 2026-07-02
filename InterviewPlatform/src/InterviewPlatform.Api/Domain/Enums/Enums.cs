namespace InterviewPlatform.Api.Domain.Enums;

public enum DecisionType { Offer = 1, Reject = 2, Hold = 3 }

public enum DocumentType { OfferLetter = 1, RejectionLetter = 2, CandidateCard = 3, InterviewProtocol = 4 }

public enum InterviewStatus { Planned = 1, InProgress = 2, Completed = 3, Cancelled = 4 }

public enum CandidateStatus { New = 1, InProgress = 2, Hired = 3, Rejected = 4 }
