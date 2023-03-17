# Arg8 [beta]
 [![GitHub Org's stars](https://img.shields.io/github/stars/textury?label=Textury&logo=github&style=for-the-badge)](https://github.com/textury) [ ![Join us on Discord](https://dcbadge.vercel.app/api/server/GtS2NzVAJG) ](https://discord.gg/GtS2NzVAJG) [![Twitter Follow](https://img.shields.io/twitter/follow/TexturyOrg?label=%40TexturyOrg&logo=Twitter&style=for-the-badge)](https://twitter.com/TexturyOrg) 
 
Try out a live Arg8 - https://arweave.live

#### What is Arg8?

**Arg8** is a light incentivized gateway for the [Arweave ecosystem](https://arweave.org), and the first ever P3 (Permaweb Payment Protocol) implementation. [Gateways](https://arwiki.wiki/#/en/gateways) are the entry point to the Permaweb, letting consumers and dapps interact with permaweb conveniently.

#### Why build a new Gateway?

Before Arg8, an incentivized and decentralized gateway option for the Arweave network wasn't available. This means, although the underlying Arweave network is entirely decentralized, the gateway infrastructure depended on a handful of gateway providers.

The Arg8 network will be resistant to single gateway failures, further decentralizing how users connect to the arweave permaweb.

The P3 protocol will ensure independent parties are properly incentivized to run their own light gateways as well.

#### Key features of **Arg8**

-   Easy to setup
-   You can run Arg8 anywhere! Locally, on any online server, no limitations.
-   Chunks can be stored locally. Or use storage services, such as: S3, DO Spaces, and GCS.
-   Flexible indexing - All, by App Name or at random.
-   **P3 Ready!** Arg8 is the first ever P3 implementation in the ecosystem. Earn revenue to help reduce the costs of running a Gateway.

#### Join the community!

If you're interested in learning more about Arg8 and all the tools, libraries and applications built by Textury, join our [Discord Server](https://arweave.live/discord.gg/GtS2NzVAJG).


## Deployment

To deploy your own instance of Arg8 you'll first need to have [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/install/) installed on your server.

- Clone this repository
- Rename .env.prod.example -> .env
- Change the variables, most important being: `APP_KEY`, `INDEX`, `MY_WALLET_ADDRESS`, `MY_WALLET_FILE`, `BLOCK_CONFIRMATION`, `RATES_CONFIG_PATH`.
- Run `docker-compose up -d --build`

## Indexer

We have 3 types of indexing data for graphql and for fast responses:

1. all - Everything will be indexed
2. random - Randomly selected data will be indexed
3. appname - Only index data for the specified appname (`App-Name` tag), for this one you also need to set the `INDEX_APP_NAME` environment variable. `appname` allow multiple values, separated by `|`.

## Sentry Integration

Sentry is integrated into our gateway, to get error reports, you must add the `SENTRY_DSN` environment variable.

## Prometheus

Prometheus is integrated into our gateway, you can access the metrics of your own gateway by going to the `/metrics` endpoint.
