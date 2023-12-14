import { HmacSHA1, enc } from "crypto-js";

// Get the private API key using frida: check out the README.md
const privateKey: string = import.meta.env.VITE_PRIVATE_KEY;

type RequestType = "POST" | "GET";

const getHostWithPort = (): string => {
    const host: string = "api.ask.fm";
    const port: number = 443;
    return `${host}:${port}`;
};

const serializeParams = (
    data: Map<
        string,
        string | number | boolean | Record<string, string | number | boolean>
    >,
    method: string
): string => {
    const sortedData: Record<
        string,
        string | number | boolean | Record<string, string | number | boolean>
    > = Object.fromEntries(
        [...data.entries()].sort((a, b) => a[0].localeCompare(b[0]))
    );

    if (method === "POST" || method === "PUT") {
        return encodeURIComponent(JSON.stringify(sortedData));
    } else {
        const arrayList: string[] = [];
        for (const [key, value] of Object.entries(sortedData)) {
            if (value !== null) {
                const encodedValue: string = encodeURIComponent(
                    value.toString()
                );
                const result: string =
                    encodeURIComponent(key) + "%" + encodedValue;
                arrayList.push(result);
            }
        }

        return arrayList.join("%");
    }
};

const generateHash = (
    requestMethodString: RequestType,
    hostWithPort: string,
    endPoint: string,
    params: Map<
        string,
        string | number | boolean | Record<string, string | number | boolean>
    >,
    secret: string
): string => {
    const sha1 = (s: string, keyString: string): string => {
        const hmac = HmacSHA1(s, keyString);
        return hmac.toString(enc.Hex).toLowerCase();
    };

    let serialized = serializeParams(params, requestMethodString);

    if (requestMethodString == "POST") serialized = `json%${serialized}`;

    return sha1(
        requestMethodString +
            "%" +
            hostWithPort +
            "%" +
            endPoint +
            "%" +
            serialized,
        secret
    );
};

export function generateSignature(
    endPoint: string,
    method: RequestType,
    paramsMap: Map<
        string,
        string | number | boolean | Record<string, string | number | boolean>
    >
): string {
    const hostWithPort: string = getHostWithPort();
    return generateHash(method, hostWithPort, endPoint, paramsMap, privateKey);
}
