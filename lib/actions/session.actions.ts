'use server';

import { EndSessionResult, StartSessionResult } from "@/types";
import { connectToDatabase } from "@/database/mongoose";
import VoiceSession from "@/database/models/voice-session.model";
import { getCurrentBillingPeriodStart } from "@/lib/subscription-constants";
import { checkSessionLimit } from "@/lib/subscription.server";

export const startVoiceSession = async (
    clerkId: string,
    bookId: string
): Promise<StartSessionResult> => {
    try {
        await connectToDatabase();

        // Enforce monthly voice session limit based on Clerk Billing plan
        const sessionCheck = await checkSessionLimit(clerkId);
        if (!sessionCheck.allowed) {
            return {
                success: false,
                error: sessionCheck.error || 'Monthly voice session limit reached.',
                isBillingError: true,
                maxDurationMinutes: sessionCheck.maxDurationMinutes,
            };
        }

        const now = new Date();
        const billingPeriodStart = getCurrentBillingPeriodStart();

        const session = await VoiceSession.create({
            clerkId,
            bookId,
            startedAt: now,
            billingPeriodStart,
            durationSeconds: 0,
        });

        return {
            success: true,
            sessionId: session._id.toString(),
            maxDurationMinutes: sessionCheck.maxDurationMinutes,
        };
    } catch (e) {
        console.error('Error starting voice session', e);
        return {
            success: false,
            error: 'Failed to start voice session. Please try again later.',
        };
    }
};

export const endVoiceSession = async (
    sessionId: string,
    durationSeconds: number
): Promise<EndSessionResult> => {
    try {
        await connectToDatabase();

        const result = await VoiceSession.findByIdAndUpdate(sessionId, {
            endedAt: new Date(),
            durationSeconds,
        });

        if (!result) {
            return { success: false, error: 'Voice session not found.' };
        }

        return { success: true };
    } catch (e) {
        console.error('Error ending voice session', e);
        return {
            success: false,
            error: 'Failed to end voice session. Please try again later.',
        };
    }
};
