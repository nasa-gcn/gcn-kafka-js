const {
  default: { version },
} = await import('./package.json', { with: { type: 'json' } })
const { parse } = await import('semver')
console.log(parse(version)?.prerelease[0] ?? '')
