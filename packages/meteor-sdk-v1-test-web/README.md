> **Engineering lab — not a reference integration.**
>
> This harness exists to exercise the protocol, including its failure modes. It exposes journal
> phases and opaque identifiers, offers opt-in plaintext staging of account secrets, and can
> deliberately strand the destination wallet. None of that belongs in a product
> (REVIEW-consumer-implementation M-04).
>
> The reference integration is
> [`packages/meteor-sdk-v1/examples/minimal-consumer/`](../meteor-sdk-v1/examples/minimal-consumer/).

...

## Deployment kinds

Each build targets one Meteor stack, chosen by `VITE_DEPLOYMENT_KIND` (config in
[`app/core/deployment.ts`](app/core/deployment.ts)). The current kind is shown as a badge in the top bar.

| | `dev` (default) | `production` |
| --- | --- | --- |
| Bridge backend | `METEOR_CONNECT_BACKENDS.development` | `METEOR_CONNECT_BACKENDS.production` |
| V1 web wallet | `https://wallet-dev.meteorwallet.app` | `https://wallet.meteorwallet.app` |
| Mobile wallet | `meteor_wallet_mobile_dev` (`meteorwalletdev://`) | `meteor_wallet_mobile` (`meteorwallet://`) |
| Build | `bun run build:dev` | `bun run build:production` |
| Deploy branch | `release/sdk-demo-app-dev` | `release/sdk-demo-app` |
| Cloudflare Pages project | `meteorwallet-sdk-demo-dev` | `meteorwallet-sdk-demo` |
| URL | <https://sdk-demo-dev.meteorwallet.app> | <https://sdk-demo.meteorwallet.app> |

`bun run dev` is the `dev` kind; run `VITE_DEPLOYMENT_KIND=production bun run dev` to try production
locally. `?backend=local|development|production|<url>` still overrides the bridge backend per page
load, and nothing else. The V1 extension is whichever one is installed in the browser, and the SDK
always sends new-key transfers to the extension under the production web wallet identity.

### Testing a NEAR Connect executor before releasing it

Both deploy builds also build the `meteor-near-connect` executor from the same commit
(`build:executor-candidates`) and ship it with the demo under `/executor/`. The NEAR Connect page's
**Executor script** selector (or `?executor=`) picks which script near-connect loads:

| `?executor=` | Script | Available |
| --- | --- | --- |
| `published` | The released executor on GCS — what real dApps load | deployed (default) and `bun run dev` |
| `candidate` | This deploy's production build — exactly what releasing this commit would upload | deployed |
| `candidate-dev` | This deploy's development build (debug logging, mobile bridge on the development stack) | deployed |
| `local` | The local `near-connect-build` watch output | `bun run dev` (default) |

So to try an executor change before releasing it: push it to `release/sdk-demo-app-dev` (or
`release/sdk-demo-app`), open `/near-connect?executor=candidate`, and only then push
`release/meteor-near-connect` to upload it to GCS.

# Welcome to React Router!

A modern, production-ready template for building full-stack React applications using React Router.

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/remix-run/react-router-templates/tree/main/default)

## Features

- 🚀 Server-side rendering
- ⚡️ Hot Module Replacement (HMR)
- 📦 Asset bundling and optimization
- 🔄 Data loading and mutations
- 🔒 TypeScript by default
- 🎉 TailwindCSS for styling
- 📖 [React Router docs](https://reactrouter.com/)

## Getting Started

### Installation

Install the dependencies:

```bash
npm install
```

### Development

Start the development server with HMR:

```bash
npm run dev
```

Your application will be available at `http://localhost:5173`.

## Building for Production

Create a production build:

```bash
npm run build
```

## Deployment

### Docker Deployment

To build and run using Docker:

```bash
docker build -t my-app .

# Run the container
docker run -p 3000:3000 my-app
```

The containerized application can be deployed to any platform that supports Docker, including:

- AWS ECS
- Google Cloud Run
- Azure Container Apps
- Digital Ocean App Platform
- Fly.io
- Railway

### DIY Deployment

If you're familiar with deploying Node applications, the built-in app server is production-ready.

Make sure to deploy the output of `npm run build`

```
├── package.json
├── package-lock.json (or pnpm-lock.yaml, or bun.lockb)
├── build/
│   ├── client/    # Static assets
│   └── server/    # Server-side code
```

## Styling

This template comes with [Tailwind CSS](https://tailwindcss.com/) already configured for a simple default starting experience. You can use whatever CSS framework you prefer.

---

Built with ❤️ using React Router.
