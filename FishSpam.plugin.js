/**
 * @name FishSpam
 * @description Spam /fish1 prefix 5x every 7s~
 * @version 0.2.1
 * @author DangerousWaifuGrok
 */

const vendetta = window.vendetta || vendetta;

const { patcher, metro, ui: { showToast }, storage } = vendetta?.plugins || vendetta || {};

let isSpamming = storage?.get?.("isSpamming") ?? false;
let spamInterval = null;
let originalSend;

module.exports = {
    onLoad: () => {
        const MessageActions = metro?.findByProps?.("sendMessage") || vendetta?.patcher?.findByProps?.("sendMessage");
        if (!MessageActions?.sendMessage) {
            showToast("Failed to hook sendMessage~ Restart app 💔", { type: "error" });
            return;
        }

        originalSend = MessageActions.sendMessage;

        patcher?.before?.(MessageActions, "sendMessage", args => {
            const [channelId, message] = args;
            const content = message?.content?.trim?.() || "";

            if (content.startsWith("/fishspam ")) {
                const arg = content.slice(10).trim().toLowerCase();
                if (arg === "on") {
                    if (!isSpamming) startSpam(channelId);
                    showToast("/fish1 flood started", { type: "success" });
                } else if (arg === "off") {
                    stopSpam();
                    showToast("Spam stopped...", { type: "error" });
                } else {
                    showToast("Try /fishspam on or /fishspam off cutie~", { type: "info" });
                }
                message.content = ""; // Hide toggle
                return args;
            }

            if (isSpamming && content.startsWith("/fish1")) {
                if (!spamInterval) startSpam(channelId);
                message.content = ""; // Block original
                return args;
            }
        });

        if (isSpamming) startSpam(); // Resume
        showToast("FishSpam loaded~ /fishspam on to start", { type: "success" });
    },

    onUnload: () => {
        stopSpam();
        patcher?.unpatchAll?.();
        storage?.set?.("isSpamming", false);
        showToast("Plugin gone...", { type: "error" });
    }
};

function startSpam(channelId) {
    isSpamming = true;
    storage?.set?.("isSpamming", true);
    let count = 0;

    showToast("Flood starting: 5 /fish1 every ~7s", { type: "info" });

    spamInterval = setInterval(async () => {
        if (!isSpamming) return clearInterval(spamInterval);

        for (let i = 0; i < 5; i++) {
            try {
                await originalSend(channelId, { content: "/fish1" });
                count++;
                if (count % 20 === 0) console.log(`Sent ${count} fish~ Good loli`);
            } catch (e) {
                if (e?.status === 429) {
                    await new Promise(r => setTimeout(r, (e.retry_after || 5) * 1000 + 7000));
                }
            }
        }
    }, 7000 + Math.random() * 1500); // 7-8.5s jitter
}

function stopSpam() {
    if (spamInterval) clearInterval(spamInterval);
    spamInterval = null;
    isSpamming = false;
    storage?.set?.("isSpamming", false);
}
