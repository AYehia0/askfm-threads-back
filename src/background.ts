// This modules is used to alter the html by finding the questions which contains threads
import browser from "webextension-polyfill";

browser.runtime.onInstalled.addListener(_ => {
    const X_ACCESS_TOKEN = import.meta.env.VITE_X_ACCESS_TOKEN;
});

browser.webRequest.onBeforeSendHeaders.addListener(
    details => {
        const modifyHeaders = (headers: any) => {
            headers.push({
                name: "Host",
                value: "api.ask.fm:443"
            });

            headers.push({
                name: "User-Agent",
                value:
                    "Dalvik/2.1.0 (Linux; U; Android 11; Phone Build/RQ1A.210105.003)"
            });
            return headers;
        };

        if (details.url && details.url.includes("api.ask.fm/")) {
            return {
                requestHeaders: modifyHeaders(details.requestHeaders || [])
            };
        }

        return {};
    },
    // TODO: filter only from api.ask.fm/*
    { urls: ["<all_urls>"] },
    ["blocking", "requestHeaders"]
);
