// frida -U -l log.js -f com.askfm
Java.perform(() => {
    const cl = Java.use("com.askfm.network.utils.Signature") 
    console.log("Started logging ...")

    cl.generateHashWithKey
        .overload('java.lang.String', 'java.lang.String', 'java.lang.String', 'java.lang.String', 'java.util.Map')
            .implementation = function(key, method, host, path, obj) {
            console.log(key, method, host, path, obj)
            this.generateHashWithKey(key, method, host, path, obj)
        }

    cl.serializeParams.overload('java.util.Map')
        .implementation = function (m) {
        const s = this.serializeParams(m)
        console.log("Serialized Params: ", s)
        return s
    }

    cl.sha1.overload('java.lang.String', 'java.lang.String')
        .implementation = function (s, keyString) {

        console.log(s, keyString)
        const sha = this.sha1(s, keyString)
        console.log("Hash", sha)
        return sha
    }
});
