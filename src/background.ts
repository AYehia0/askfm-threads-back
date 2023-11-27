// This modules is used to alter the html by finding the questions which contains threads
import browser from "webextension-polyfill";

browser.runtime.onInstalled.addListener((details) => {
    console.log("Extension installed:", details);

    const X_ACCESS_TOKEN = import.meta.env.VITE_X_ACCESS_TOKEN

    // maybe store the api key ? or nah
    console.log(X_ACCESS_TOKEN)
});


chrome.webRequest.onBeforeSendHeaders.addListener(
  (details: chrome.webRequest.WebRequestHeadersDetails) => {

    const modifyHeaders = (headers: chrome.webRequest.HttpHeader[]): chrome.webRequest.HttpHeader[] => {
        headers.push({
            name: "Host",
            value: "api.ask.fm:443"
        })

        headers.push({
            name: "User-Agent",
            value: "Dalvik/2.1.0 (Linux; U; Android 11; Phone Build/RQ1A.210105.003)"
        })
        return headers;
    };

    if (details.url && details.url.includes('api.ask.fm/')) {
        console.log(details.url)
        console.log(details.requestHeaders)
        return { requestHeaders: modifyHeaders(details.requestHeaders || []) };
    }

    return {};
  },
  // TODO: filter only from api.ask.fm/*
  { urls: ["<all_urls>"] },
  ["blocking", "requestHeaders"]
);
