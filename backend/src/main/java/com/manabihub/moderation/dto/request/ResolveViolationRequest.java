package com.manabihub.moderation.dto.request;

import com.manabihub.moderation.enums.ModerationActionType;
import com.manabihub.moderation.enums.ModerationDecisionType;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.List;
import java.util.UUID;

@Data
public class ResolveViolationRequest {
    
    @NotNull(message = "{MSG-COM-002}")
    private ModerationDecisionType decision;
    
    private List<ModerationActionType> actions;
    
    private String decisionNote;
    
    private List<UUID> targetIds;
}
