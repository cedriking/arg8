import { PathManifestInterface } from 'App/Interfaces/PathManifest'

export const resolveManifestPath = (
  { index, paths }: PathManifestInterface,
  subpath: string | undefined
): string | undefined => {
  if (subpath && paths[subpath]) {
    return paths[subpath] ? paths[subpath].id : undefined
  }

  if (!subpath && index && index.path && paths[index.path] && paths[index.path].id) {
    return paths[index.path].id
  }
}
