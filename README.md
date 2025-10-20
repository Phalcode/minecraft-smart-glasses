# Smart Glasses

Im

**WARNING: This mod is work in progress and is not ready for use.**

## Features

- [ ] Night Vision
- [ ] Shows Block Names
- [ ] Shows Enemy Health
- [ ] Shows Coordinates
- [ ] Shows Biome
- [ ] Shows Light Level
- [ ] Automatically Switches Tools in Hotbar
- [ ] Shows Chest Fill Level

## Development

### Install Node.js tools, if you haven't already

We're going to use the package manager [npm](https://www.npmjs.com/package/npm) to get more tools to make the process of building our project easier.

Visit [https://nodejs.org/](https://nodejs.org).

Download the version with "LTS" next to the number and install it. (LTS stands for Long Term Support, if you're curious.) In the Node.js Windows installer, accept the installation defaults. You do not need to install any additional tools for Native compilation.

### Install Visual Studio Code, if you haven't already

Visit the [Visual Studio Code website](https://code.visualstudio.com) and install Visual Studio Code.

### Install the Dependencies

Run `npm install` in your Visual Studio Code terminal to install all the dependencies of this project.

### Build the Project

Run `npx just-scripts local-deploy` to build the project and deploy it to your installed Minecraft client.

### Debugging

- Install the [recommended VSCode Extensions](.vscode/extensions.json)
- Open powershell and run `CheckNetIsolation.exe LoopbackExempt -a -p=S-1-15-2-1958404141-86561845-1752920682-3514627264-368642714-62675701-733520436`.
- Run the VSCode debugger using the preconfigured `Debug with Minecraft` configuration
- Start Minecraft, and connect to the debugger by typing ``/script debugger connect` in the chat.
