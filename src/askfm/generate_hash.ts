import {HmacSHA1, enc} from 'crypto-js';

console.log("Hello, sir")

// Get the private API key using frida: check out the README.md
const privateKey: string = import.meta.env.VITE_PRIVATE_KEY;

type RequestType = "POST" | "GET"

const getHostWithPort = (): string => {
    const host: string = "api.ask.fm";
    const port: number = 443;
    return `${host}:${port}`;
};

const getUnixTime = (): number => {
    return Math.floor(new Date().getTime() / 1000);
};

const generateParamsByMethod = (hashMap: Map<string, string | number>, currentUnixTime: number): Map<string, string | number> => {
    hashMap.set("rt", "1");
    hashMap.set("ts", currentUnixTime);
    //TODO: Check if the method is : POST
    return hashMap
};

const concatenateList = (list: (string | number)[], str: string): string => {
    if (list.length === 0) {
        return '';
    }

    const sb: (string | number)[] = [list[0]];
    const size: number = list.length;

    for (let i = 1; i < size; i++) {
        sb.push(str);
        sb.push(list[i]);
    }

    return sb.join('');
};

const customEncode = (str: string | null): string => {
    if (str !== null) {
        try {
            const encoded: string = encodeURIComponent(str);
            const result: string = encoded
                .replace(/%7E/g, '~')
                .replace(/%29/g, ')')
                .replace(/%28/g, '(')
                .replace(/%27/g, "'")
                .replace(/%21/g, '!')
                .replace(/\+/g, '%20');

            return result;
        } catch (e) {
            console.error('Error encoding:', e);
            return str;
        }
    }
    return '';
};

const serializeParams = (data: Map<string, string | number>): string => {
    const arrayList: string[] = [];

    data.forEach((value, key) => {
        if (value !== null) {
            const encodedValue: string = customEncode(value.toString());
            const result: string = customEncode(key) + '%' + encodedValue;
            arrayList.push(result);
        }
    });

    arrayList.sort();
    return concatenateList(arrayList, '%');
};

const generateHash = (
    requestMethodString: RequestType,
    hostWithPort: string,
    endPoint: string,
    params: Map<string, string | number>,
    secret: string
): string => {

    const sha1 = (s: string, keyString: string): string => {
        const hmac = HmacSHA1(s, keyString);
        return hmac.toString(enc.Hex).toLowerCase();
    };

    const serialized: string = serializeParams(params);

    return sha1(requestMethodString + "%" + hostWithPort + "%" + endPoint + "%" + serialized, secret);
};

function generateSignature(endPoint: string,
                           requestType: RequestType, 
                           paramsMap: Map<string, 
                           string | number>, 
                           currentUnixTime: number): string {
    const hostWithPort: string = getHostWithPort();
    const defaultParams = generateParamsByMethod(paramsMap, currentUnixTime)
    return generateHash(requestType, hostWithPort, endPoint, defaultParams, privateKey);
}

export {
    generateSignature,
    getUnixTime
}
