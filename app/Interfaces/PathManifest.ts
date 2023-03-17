export interface PathManifestInterface {
  manifest: 'arweave/paths'
  version: string
  paths: {
    [key: string]: {
      id: string
    }
  }
  index?: {
    path: string
  }
}
