# campaign-mandrill

> Mandrill email provider for Campaign

# install

```shell
npm i campaign-mandrill -S
```

# usage

using [`campaign`](https://github.com/bevacqua/campaign).

```js
var campaign = require('campaign');
var mandrill = require('campaign-mandrill');
var client = campaign({
  provider: mandrill({
    apiKey: 'YOUR_API_KEY',
    debug: false
  })
});
client.send(...) // as usual
```

# `mandrill(options)`

minimal configuration is involved.

## `options.apiKey`

the API key from mandrill. alternatively, you can set `process.env.MANDRILL_APIKEY`.


## `options.debug`

turn on internal debugging for [`mandrill-api`](https://bitbucket.org/mailchimp/mandrill-api-node/src) module

# license

mit
