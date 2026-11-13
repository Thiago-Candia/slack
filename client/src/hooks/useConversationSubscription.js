import { useEffect, useRef } from "react";
import { getConsumer } from "../services/cable";

export const useConversationSubscription = (params, { onMessage, onReconnect }) => {
    const handlers = useRef({ onMessage, onReconnect });
    const paramsKey = params ? JSON.stringify(params) : null;

    useEffect(() => {
        handlers.current = { onMessage, onReconnect };
    });

    useEffect(() => {
        if (!paramsKey) {
            return undefined;
        }

        let wasConnected = false;

        const subscription = getConsumer().subscriptions.create(
            { channel: "ConversationChannel", ...JSON.parse(paramsKey) },
            {
                connected() {
                    if (wasConnected) {
                        handlers.current.onReconnect?.();
                    }
                    wasConnected = true;
                },
                received(event) {
                    handlers.current.onMessage?.(event);
                }
            }
        );

        return () => subscription.unsubscribe();
    }, [paramsKey]);
};