// Set production environment before imports to evaluate production-specific settings
process.env.NODE_ENV = 'production'

async function runStagingSslCheck() {
  const { authOptions } = await import('../lib/auth')
  console.log('==================================================')
  console.log('  SMARTHOTEL OS: STAGING HTTPS & COOKIE AUDIT SUITE ')
  console.log('==================================================\n')

  let passed = true

  const fail = (msg: string) => {
    console.error(`❌ [FAIL] ${msg}`)
    passed = false
  }

  const pass = (msg: string) => {
    console.log(`✅ [PASS] ${msg}`)
  }

  // 1. Session Token Cookie Verification
  console.log('🔍 [CHECK 1/4] Auditing Session Token Cookies...')
  const sessionToken = authOptions.cookies?.sessionToken
  if (!sessionToken) {
    fail('Session token cookie configuration not found in authOptions')
  } else {
    if (sessionToken.name !== '__Secure-next-auth.session-token') {
      fail(`Session cookie name should be '__Secure-next-auth.session-token' in production, found: '${sessionToken.name}'`)
    } else {
      pass(`Session cookie name is correctly prefixed: '${sessionToken.name}'`)
    }

    const { options } = sessionToken
    if (!options.secure) {
      fail('Session cookie secure option is false (must be true in production)')
    } else {
      pass('Session cookie `secure` flag is active')
    }

    if (!options.httpOnly) {
      fail('Session cookie httpOnly option is false (must be true)')
    } else {
      pass('Session cookie `httpOnly` flag is active')
    }

    if (options.sameSite !== 'lax') {
      fail(`Session cookie sameSite option must be 'lax', found: '${options.sameSite}'`)
    } else {
      pass("Session cookie `sameSite` policy is 'lax'")
    }
  }

  // 2. CSRF Token Cookie Verification
  console.log('\n🔍 [CHECK 2/4] Auditing CSRF Token Cookies...')
  const csrfToken = authOptions.cookies?.csrfToken
  if (!csrfToken) {
    fail('CSRF token cookie configuration not found in authOptions')
  } else {
    if (csrfToken.name !== '__Host-next-auth.csrf-token') {
      fail(`CSRF cookie name should be '__Host-next-auth.csrf-token' in production, found: '${csrfToken.name}'`)
    } else {
      pass(`CSRF cookie name is correctly prefixed: '${csrfToken.name}'`)
    }

    const { options } = csrfToken
    if (!options.secure) {
      fail('CSRF cookie secure option is false')
    } else {
      pass('CSRF cookie `secure` flag is active')
    }

    if (!options.httpOnly) {
      fail('CSRF cookie httpOnly option is false')
    } else {
      pass('CSRF cookie `httpOnly` flag is active')
    }
  }

  // 3. Callback URL Cookie Verification
  console.log('\n🔍 [CHECK 3/4] Auditing Callback URL Cookies...')
  const callbackUrl = authOptions.cookies?.callbackUrl
  if (!callbackUrl) {
    fail('Callback URL cookie configuration not found in authOptions')
  } else {
    if (callbackUrl.name !== '__Secure-next-auth.callback-url') {
      fail(`Callback cookie name should be '__Secure-next-auth.callback-url' in production, found: '${callbackUrl.name}'`)
    } else {
      pass(`Callback cookie name is correctly prefixed: '${callbackUrl.name}'`)
    }

    const { options } = callbackUrl
    if (!options.secure) {
      fail('Callback cookie secure option is false')
    } else {
      pass('Callback cookie `secure` flag is active')
    }
  }

  // 4. Secure HTTPS Redirect Enforcement
  console.log('\n🔍 [CHECK 4/4] Verifying HTTPS/SSL Environment Enforcements...')
  const nextAuthUrl = process.env.NEXTAUTH_URL
  if (nextAuthUrl && nextAuthUrl.startsWith('http://') && !nextAuthUrl.includes('localhost')) {
    fail(`Staging NEXTAUTH_URL should use https://, found: '${nextAuthUrl}'`)
  } else {
    pass(`Environment NEXTAUTH_URL checks passed: '${nextAuthUrl || 'not set'}'`)
  }

  console.log('\n==================================================')
  if (passed) {
    console.log('🎉 COOKIE & SSL COMPLIANCE: AUDIT PASSED')
    console.log('==================================================\n')
    process.exit(0)
  } else {
    console.error('🚨 COOKIE & SSL COMPLIANCE: AUDIT FAILED')
    console.log('==================================================\n')
    process.exit(1)
  }
}

runStagingSslCheck()
