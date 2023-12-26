import { Message, ThreadDetails } from "./api.types";
import { AxiosResponse } from "axios";

// get a timestamp (UNIX) floored
export const getUnixTime = (): number => {
    return Math.floor(new Date().getTime() / 1000);
};

// builds the url just like what ask.fm likes: sorted queries
export const buildUrl = (hashMap: Map<string, string | number>): string => {
    const entries = [...hashMap.entries()].sort((a, b) =>
        a[0].localeCompare(b[0])
    );
    let url = "";
    entries.forEach(entry => {
        url += `${entry[0]}=${entry[1]}&`;
    });
    // remove the last &
    return url.slice(0, -1);
};

export const extractThreadDetails = (
    resp: AxiosResponse<any, any>
): ThreadDetails => {
    const data = resp.data;
    const messages: Message[] = data?.messages || [];

    return {
        loggedInUser: resp.headers.login,
        threadId: data?.root?.qid,
        owner: {
            owner: data?.owner?.uid,
            avatarUrl: data?.owner?.avatarUrl,
            fullName: data?.owner?.fullName
        },
        root: {
            author: data?.root?.author,
            authorName: data?.root?.authorName,
            avatarThumbUrl: data?.root?.avatarThumbUrl,
            createdAt: data?.root?.createdAt
        },
        answer: {
            type: data?.root?.answer?.type,
            body: data?.root?.answer?.body,
            createdAt: data?.root?.answer?.createdAt,
            photoThumbUrl: data?.root?.answer?.photoThumbUrl
        },
        messages: messages.map((message: any) =>
            extractMessageDetails(message, resp.headers.login)
        )
    } as ThreadDetails;
};

export const extractMessageDetails = (
    data: any,
    loggedInUser: string
): Message => {
    return {
        id: data.id,
        fullName: data.fullName,
        accountId: data.isOwn ? loggedInUser : data.uid,
        avatarUrl: data.avatarUrl,
        createdAt: data.createdAt,
        text: data.text,
        isOwn: data.isOwn
    } as Message;
};

// returns a dictionary of headers : {key: value}
// X-Api-Version: 1.18
// X-Client-Type: android_4.91.1
// X-Access-Token:
export const getHeaders = (): Record<string, string> => {
    return {
        "X-Api-Version": "1.18",
        "X-Client-Type": "android_4.91.1",
        "X-Access-Token": import.meta.env.VITE_X_ACCESS_TOKEN
    };
};
