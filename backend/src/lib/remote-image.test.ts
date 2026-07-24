import assert from 'node:assert/strict'
import test from 'node:test'
import { isValidImage } from './cloudflare-r2'
import { isPrivateNetworkAddress } from './remote-image'

test('blocks private and reserved network addresses', () => {
  for (const address of ['127.0.0.1', '10.0.0.2', '172.16.0.1', '192.168.1.1', '169.254.1.1', '::1', 'fd00::1', 'fe80::1']) {
    assert.equal(isPrivateNetworkAddress(address), true, address)
  }
})

test('allows public network addresses', () => {
  assert.equal(isPrivateNetworkAddress('8.8.8.8'), false)
  assert.equal(isPrivateNetworkAddress('2606:4700:4700::1111'), false)
})

test('validates image signatures instead of trusting MIME labels', () => {
  assert.equal(isValidImage(Buffer.from('not an image'), 'image/jpeg'), false)
  assert.equal(
    isValidImage(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), 'image/png'),
    true,
  )
  assert.equal(isValidImage(Buffer.from('GIF89a'), 'image/gif'), true)
})
