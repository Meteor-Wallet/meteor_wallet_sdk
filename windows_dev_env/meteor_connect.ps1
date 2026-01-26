# start-dev.ps1

# -w 0 tells Windows Terminal to use the CURRENT window
# nt (new-tab) creates a new tab
# -d sets the directory
# -p sets the profile (optional). E.g. -p "PowerShell"

wt -w 0 nt -d ".\packages\meteor-near-connect" pwsh -NoExit -Command "bun run build-dev-watch" `; `
      nt -d ".\packages\meteor-sdk-v1-test-web" pwsh -NoExit -Command "bun run watch-meteor-script" `; `
      nt -d ".\packages\meteor-sdk-v1-test-web" pwsh -NoExit -Command "bun dev"