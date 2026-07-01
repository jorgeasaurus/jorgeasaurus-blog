import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

export function getFlagValue(args, name) {
  const exactIndex = args.indexOf(name)

  if (exactIndex >= 0) {
    return args[exactIndex + 1]
  }

  const prefix = `${name}=`
  const inline = args.find((arg) => arg.startsWith(prefix))

  return inline ? inline.slice(prefix.length) : undefined
}

export function hasFlag(args, name) {
  return args.includes(name)
}

export function loadLocalEnv() {
  const envPath = resolve(process.cwd(), '.env.local')

  if (existsSync(envPath) && typeof process.loadEnvFile === 'function') {
    process.loadEnvFile(envPath)
  }
}
