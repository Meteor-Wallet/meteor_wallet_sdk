# start-dev.ps1

# -w 0 tells Windows Terminal to use the CURRENT window
# nt (new-tab) creates a new tab
# -d sets the directory
# -p sets the profile (optional). E.g. -p "PowerShell"

wt -w 0 nt -d ".\packages\meteor-near-connect" pwsh -NoExit -Command "bun dev" `; `
      nt -d "..\meteor_wallet\web\packages\meteor-frontend" pwsh -NoExit -Command "bun run ext:dev"