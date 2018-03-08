# Proxy Endpoint

Create IO endpoint from the Record class. This endpoint is designed for use on the server side data layer managed by Type-R.

Assuming that you have Type-R records with endpoints working with the database, you can create an endpoint which will use
Record subclass as a transport.

    import { proxyIO } from 'type-r/endpoint/proxy'
    
    ...

    const usersIO = proxyIO( User );

This endpoint can be connected to the RESTful endpoint API on the server side which will serve JSON to the restfulIO endpoint on the client.
An advantage of this approach is that JSON schema will be transparently validated on the server side by the Type-R.