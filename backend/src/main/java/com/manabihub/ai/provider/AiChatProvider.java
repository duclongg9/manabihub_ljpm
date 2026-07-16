package com.manabihub.ai.provider;

import com.manabihub.ai.domain.AiChatContext;

public interface AiChatProvider {

    AiChatProviderResult generate(AiChatContext context, String question);
}
