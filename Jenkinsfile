pipeline {

    agent any

    triggers {
        githubPush()
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 60, unit: 'MINUTES')
        timestamps()
        disableConcurrentBuilds()
    }

    environment {
        APP_NAME                = 'kash'
        REPO_URL                = 'https://github.com/ngohainnam/kash.git'
        SONAR_PROJECT_KEY       = 'ngohainnam_kash'
        SONAR_ORGANIZATION      = 'ngohainnam'
        NEXT_TELEMETRY_DISABLED = '1'
        SENTRY_ORG              = 'swinburne-university-of-tec-fl'
        SENTRY_PROJECT          = 'kash'
    }

    stages {

        stage('Checkout') {
            steps {
                echo '--- STAGE: CHECKOUT ---'
                git branch: 'master', url: "${env.REPO_URL}"
                script {
                    env.GIT_COMMIT_SHORT = bat(returnStdout: true,
                        script: '@git rev-parse --short HEAD').trim().readLines().last().trim()
                    env.GIT_BRANCH = bat(returnStdout: true,
                        script: '@git rev-parse --abbrev-ref HEAD').trim().readLines().last().trim()
                }
                echo "Commit: ${env.GIT_COMMIT_SHORT} | Branch: ${env.GIT_BRANCH}"
            }
        }

        stage('Build') {
            steps {
                echo '--- STAGE: BUILD ---'
                bat 'node --version'
                bat 'npm --version'
                bat 'npm ci --loglevel=error'
                bat 'npx prisma generate'
                bat 'npm install -g vercel'
                withCredentials([
                    string(credentialsId: 'DATABASE_URL',                      variable: 'DATABASE_URL'),
                    string(credentialsId: 'CLERK_SECRET_KEY',                  variable: 'CLERK_SECRET_KEY'),
                    string(credentialsId: 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', variable: 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'),
                    string(credentialsId: 'GEMINI_API_KEY',                    variable: 'GEMINI_API_KEY')
                ]) {
                    bat 'npm run build'
                }
                archiveArtifacts artifacts: '.next/BUILD_ID', fingerprint: true, allowEmptyArchive: true
            }

            post {
                success { echo '[BUILD] PASSED' }
                failure { error '[BUILD] FAILED - stopping pipeline.' }
            }
        }

        stage('Test') {
            steps {
                echo '--- STAGE: TEST ---'
                script {
                    def rc = bat(returnStatus: true, script: '''
                        set JEST_JUNIT_OUTPUT_NAME=junit.xml
                        set JEST_JUNIT_OUTPUT_DIR=.
                        npm test -- --ci --coverage --coverageDirectory=coverage --reporters=default --reporters=jest-junit --forceExit --passWithNoTests
                    ''')
                    if (rc != 0) {
                        currentBuild.result = 'UNSTABLE'
                        echo "[TEST] Failures detected (exit ${rc}). Build marked UNSTABLE."
                    } else {
                        echo '[TEST] All tests passed.'
                    }
                }
            }

            post {
                always {
                    junit allowEmptyResults: true, testResults: 'junit.xml'
                    publishHTML(target: [
                        allowMissing         : true,
                        alwaysLinkToLastBuild: true,
                        keepAll              : true,
                        reportDir            : 'coverage/lcov-report',
                        reportFiles          : 'index.html',
                        reportName           : 'Test Coverage Report'
                    ])
                    archiveArtifacts artifacts: 'junit.xml,coverage/lcov.info,coverage/lcov-report/**', allowEmptyArchive: true
                }
            }
        }

        stage('Code Quality') {
            steps {
                echo '--- STAGE: CODE QUALITY (SonarCloud) ---'
                withCredentials([string(credentialsId: 'SONAR_TOKEN', variable: 'SONAR_TOKEN')]) {
                    bat '''
                        if not exist sonar-scanner\\sonar-scanner-5.0.1.3006-windows\\bin\\sonar-scanner.bat (
                            powershell -Command "Invoke-WebRequest -Uri https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-5.0.1.3006-windows.zip -OutFile sonar-scanner.zip"
                            powershell -Command "Expand-Archive -Path sonar-scanner.zip -DestinationPath sonar-scanner -Force"
                        )
                        sonar-scanner\\sonar-scanner-5.0.1.3006-windows\\bin\\sonar-scanner.bat ^
                          -Dsonar.projectKey=%SONAR_PROJECT_KEY% ^
                          -Dsonar.organization=%SONAR_ORGANIZATION% ^
                          -Dsonar.host.url=https://sonarcloud.io ^
                          -Dsonar.login=%SONAR_TOKEN% ^
                          -Dsonar.sources=. ^
                          -Dsonar.exclusions=node_modules/**,test/**,.next/**,prisma/migrations/**,coverage/**,junit.xml,audit-report.json,audit-report.txt,Jenkinsfile ^
                          -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info
                    '''
                }
                echo '[SONAR] Analysis submitted to SonarCloud.'
            }

            post {
                success { echo '[SONAR] PASSED' }
                failure { echo '[SONAR] FAILED - check SonarCloud dashboard.' }
            }
        }

        stage('Security') {
            steps {
                echo '--- STAGE: SECURITY SCANNING ---'
                bat 'npm audit --json > audit-report.json 2>&1 || exit /b 0'
                bat 'npm audit        > audit-report.txt  2>&1 || exit /b 0'

                script {
                    def rc = bat(returnStatus: true, script: '''
                        node -e "var fs=require('fs');if(!fs.existsSync('audit-report.json')){console.log('No report.');process.exit(0);}var d;try{d=JSON.parse(fs.readFileSync('audit-report.json','utf8'));}catch(e){console.log('Cannot parse report.');process.exit(0);}var v=(d.metadata&&d.metadata.vulnerabilities)||{};var c=v.critical||0,h=v.high||0,m=v.moderate||0,l=v.low||0;console.log('');console.log('=== Audit Summary ===');console.log('CRITICAL: '+c);console.log('HIGH    : '+h);console.log('MODERATE: '+m);console.log('LOW     : '+l);console.log('=====================');if(c>0){process.exit(2);}if(h>0){process.exit(1);}process.exit(0);"
                    ''')
                    if (rc == 2) {
                        error '[SECURITY] CRITICAL vulnerabilities found. Deployment blocked.'
                    } else if (rc == 1) {
                        currentBuild.result = 'UNSTABLE'
                        echo '[SECURITY] HIGH vulnerabilities found. Build marked UNSTABLE. Review audit-report.txt.'
                    } else {
                        echo '[SECURITY] No critical or high vulnerabilities found.'
                    }
                }
            }

            post {
                always {
                    archiveArtifacts artifacts: 'audit-report.json, audit-report.txt', allowEmptyArchive: true
                }
                success  { echo '[SECURITY] PASSED' }
                unstable { echo '[SECURITY] UNSTABLE - HIGH vulnerabilities present.' }
                failure  { echo '[SECURITY] FAILED - CRITICAL vulnerabilities present.' }
            }
        }

        stage('Deploy') {
            steps {
                echo '--- STAGE: DEPLOY ---'
                withCredentials([
                    string(credentialsId: 'VERCEL_TOKEN',                      variable: 'VERCEL_TOKEN'),
                    string(credentialsId: 'VERCEL_ORG_ID',                     variable: 'VERCEL_ORG_ID'),
                    string(credentialsId: 'VERCEL_PROJECT_ID',                 variable: 'VERCEL_PROJECT_ID'),
                    string(credentialsId: 'DATABASE_URL',                      variable: 'DATABASE_URL'),
                    string(credentialsId: 'CLERK_SECRET_KEY',                  variable: 'CLERK_SECRET_KEY'),
                    string(credentialsId: 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', variable: 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'),
                    string(credentialsId: 'GEMINI_API_KEY',                    variable: 'GEMINI_API_KEY')
                ]) {
                    bat '''
                        set VERCEL_ORG_ID=%VERCEL_ORG_ID%
                        set VERCEL_PROJECT_ID=%VERCEL_PROJECT_ID%
                        vercel deploy --token=%VERCEL_TOKEN% --yes ^
                          --build-env DATABASE_URL="%DATABASE_URL%" ^
                          --build-env CLERK_SECRET_KEY="%CLERK_SECRET_KEY%" ^
                          --build-env NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="%NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY%" ^
                          --build-env GEMINI_API_KEY="%GEMINI_API_KEY%" ^
                          --build-env NEXT_TELEMETRY_DISABLED=1 ^
                          > staging-url.txt 2>&1
                        type staging-url.txt
                    '''
                    bat '''
                        node -e "var fs=require('fs'),c=fs.readFileSync('staging-url.txt','utf8'),m=c.match(new RegExp('https://[a-zA-Z0-9][a-zA-Z0-9-]*[.]vercel[.]app'));fs.writeFileSync('staging-url-parsed.txt',m?m[0]:'');"
                    '''
                    script {
                        def urlLine = readFile('staging-url-parsed.txt').trim()
                        if (urlLine) {
                            env.STAGING_URL = urlLine
                            echo "[STAGING] Preview URL: ${env.STAGING_URL}"
                        } else {
                            echo '[STAGING] WARNING: Could not parse deployment URL from Vercel output.'
                        }
                        echo '[STAGING] No health check - Vercel preview deployments require authentication.'
                    }
                }
                archiveArtifacts artifacts: 'staging-url.txt,staging-url-parsed.txt', fingerprint: true, allowEmptyArchive: true
            }

            post {
                success  { echo '[STAGING] PASSED - preview deployment live.' }
                unstable { echo '[STAGING] UNSTABLE - smoke test failed.' }
                failure  { echo '[STAGING] FAILED.' }
            }
        }

        stage('Release') {
            when { expression { env.GIT_BRANCH ==~ /(.*\/)?master/ } }
            steps {
                echo '--- STAGE: RELEASE ---'
                bat '''
                    git config user.email "ngohainnam@gmail.com"
                    git config user.name  "ngohainnam"
                    git tag -a "v%BUILD_NUMBER%" -m "Release v%BUILD_NUMBER% deployed by Jenkins" 2>NUL || exit /b 0
                    echo [RELEASE] Tagged v%BUILD_NUMBER%.
                '''
                withCredentials([
                    string(credentialsId: 'VERCEL_TOKEN',                      variable: 'VERCEL_TOKEN'),
                    string(credentialsId: 'VERCEL_ORG_ID',                     variable: 'VERCEL_ORG_ID'),
                    string(credentialsId: 'VERCEL_PROJECT_ID',                 variable: 'VERCEL_PROJECT_ID'),
                    string(credentialsId: 'DATABASE_URL',                      variable: 'DATABASE_URL'),
                    string(credentialsId: 'CLERK_SECRET_KEY',                  variable: 'CLERK_SECRET_KEY'),
                    string(credentialsId: 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', variable: 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'),
                    string(credentialsId: 'GEMINI_API_KEY',                    variable: 'GEMINI_API_KEY')
                ]) {
                    bat '''
                        set VERCEL_ORG_ID=%VERCEL_ORG_ID%
                        set VERCEL_PROJECT_ID=%VERCEL_PROJECT_ID%
                        vercel deploy --prod --token=%VERCEL_TOKEN% --yes ^
                          --build-env DATABASE_URL="%DATABASE_URL%" ^
                          --build-env CLERK_SECRET_KEY="%CLERK_SECRET_KEY%" ^
                          --build-env NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="%NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY%" ^
                          --build-env GEMINI_API_KEY="%GEMINI_API_KEY%" ^
                          --build-env NEXT_TELEMETRY_DISABLED=1 ^
                          > production-url.txt 2>&1
                        type production-url.txt
                    '''
                }
                bat '''
                    node -e "var fs=require('fs'),c=fs.readFileSync('production-url.txt','utf8'),m=c.match(new RegExp('https://[a-zA-Z0-9][a-zA-Z0-9-]*[.]vercel[.]app'));fs.writeFileSync('production-url-parsed.txt',m?m[0]:'');"
                '''
                script {
                    def urlLine = readFile('production-url-parsed.txt').trim()
                    if (urlLine) {
                        env.PRODUCTION_URL = urlLine
                        echo "[RELEASE] Production live at: ${env.PRODUCTION_URL}"
                    } else {
                        echo '[RELEASE] WARNING: Could not parse production URL from Vercel output.'
                    }
                    writeFile file: 'release-metadata.txt', text: """\
Release : v${env.BUILD_NUMBER}
Commit  : ${env.GIT_COMMIT_SHORT ?: 'N/A'}
URL     : ${env.PRODUCTION_URL ?: 'N/A'}
Time    : ${new Date().toString()}
"""
                }
                archiveArtifacts artifacts: 'production-url.txt,production-url-parsed.txt,release-metadata.txt', fingerprint: true, allowEmptyArchive: true
            }

            post {
                success { echo '[RELEASE] PASSED - production live.' }
                failure { echo '[RELEASE] FAILED. Previous Vercel deployment remains active (atomic deploys).' }
            }
        }

        stage('Monitoring') {
            steps {
                echo '--- STAGE: MONITORING & OBSERVABILITY ---'
                script {
                    env.HEALTH_URL = "${env.PRODUCTION_URL ?: 'https://kash-two-taupe.vercel.app'}/api/health"
                }
                echo "[MONITORING] Health endpoint: ${env.HEALTH_URL}"

                bat """
                    set HEALTH_URL=${env.HEALTH_URL}
                    powershell -NonInteractive -Command "\$url=\$env:HEALTH_URL;\$max=5;\$delay=10;for(\$i=1;\$i -le \$max;\$i++){try{\$r=Invoke-WebRequest -Uri \$url -UseBasicParsing -TimeoutSec 15;if(\$r.StatusCode -eq 200){Write-Host '[MONITORING] Health check PASSED (HTTP 200)';exit 0;}Write-Host('[MONITORING] Attempt '+\$i+': HTTP '+\$r.StatusCode);}catch{Write-Host('[MONITORING] Attempt '+\$i+' error: '+\$_.Exception.Message);}if(\$i -lt \$max){Start-Sleep -Seconds \$delay;\$delay=\$delay*2;}}Write-Host '[MONITORING] FAILED after all retries';exit 1;"
                """

                script {
                    def sentryVersion = "${env.APP_NAME}@${env.BUILD_NUMBER}"
                    withCredentials([
                        string(credentialsId: 'SENTRY_AUTH_TOKEN', variable: 'SENTRY_AUTH_TOKEN')
                    ]) {
                        bat """
                            where sentry-cli 2>NUL || npm install -g @sentry/cli
                            sentry-cli releases new "${sentryVersion}" --org=%SENTRY_ORG% --project=%SENTRY_PROJECT% || exit /b 0
                            sentry-cli releases set-commits "${sentryVersion}" --auto --org=%SENTRY_ORG% || exit /b 0
                            sentry-cli releases finalize "${sentryVersion}" --org=%SENTRY_ORG% || exit /b 0
                            sentry-cli releases deploys "${sentryVersion}" new -e production --org=%SENTRY_ORG% || exit /b 0
                        """
                    }
                    echo "[MONITORING] Sentry release '${sentryVersion}' registered in production."
                }
            }

            post {
                success { echo '[MONITORING] PASSED - production is healthy and monitored via Sentry.' }
                failure { echo '[MONITORING] FAILED - investigate production health immediately.' }
            }
        }

    }

    post {

        always {
            echo '==========================================='
            echo " BUILD #${env.BUILD_NUMBER} | ${currentBuild.currentResult}"
            echo " Duration : ${currentBuild.durationString}"
            echo " Commit   : ${env.GIT_COMMIT_SHORT ?: 'N/A'}"
            echo '==========================================='
            bat 'if exist sonar-scanner.zip del sonar-scanner.zip'
        }

        success {
            echo "[NOTIFY] Build #${env.BUILD_NUMBER} SUCCEEDED."
            echo "[NOTIFY] Production: ${env.PRODUCTION_URL ?: 'N/A'}"
        }

        unstable {
            echo "[NOTIFY] Build #${env.BUILD_NUMBER} UNSTABLE - review test or security output."
        }

        failure {
            echo "[NOTIFY] Build #${env.BUILD_NUMBER} FAILED. Check console output above."
        }
    }
}