# Smart Glasses 🕶️

**Smart Glasses** is a _vanilla-friendly futuristic Minecraft: Bedrock Edition addon_ that brings an immersive, high‑tech twist to your Minecraft world — without breaking the original aesthetic. Equip them to access real-time world data right on your screen.

![ModJam Banner](https://github.com/Phalcode/minecraft-smart-glasses/blob/master/img/modjam.png?raw=true)

## ✨ Features

| Feature            |                  Status | Description                                      |
| ------------------ | ----------------------: | ------------------------------------------------ |
| Night Vision       |     Not Yet Implemented | See clearly in the darkest caves and nights      |
| Shows Block Names  | Implemented without GUI | Instantly identify any block you’re looking at   |
| Shows Enemy Health | Implemented without GUI | Displays health bars for nearby enemies          |
| Shows Coordinates  |     Not Yet Implemented | Know your exact position at all times            |
| Shows Biome        |     Not Yet Implemented | Reveals the biome you’re currently in            |
| Shows Light Level  |     Not Yet Implemented | Useful for mob-proofing your builds              |
| Auto Tool Switch   |     Not Yet Implemented | Automatically picks the best tool in your hotbar |
| Chest Fill Level   |     Not Yet Implemented | See at a glance how full a chest is              |

## 🖼️ Screenshots

![Screenshot](https://github.com/Phalcode/minecraft-smart-glasses/blob/master/img/screenshot_1.png?raw=true)

## ⚙️ Installation

1. Download the [latest release](https://github.com/Phalcode/minecraft-smart-glasses/releases/latest).
2. Open the `.mcaddon` file to install it into your Minecraft client.
3. In your world settings, **activate both the Behavior Pack and the Resource Pack**.
4. Launch your world and enjoy the future of survival!

## 🧠 Usage

### Obtaining the Smart Glasses

The Smart Glasses are considered a **mid‑game utility item**.
They can be crafted once you have the right materials:

**Recipe:**

To craft the Smart Glasses, you'll need:

- 1x Diamond
- 1x Redstone
- 2x Netherite Scrap
- 2x Blaze Rod
- 2x Nether Quartz

![Recipe](https://github.com/Phalcode/minecraft-smart-glasses/blob/master/img/recipe.png?raw=true)

### Activating the Smart Glasses

Simply **equip the Smart Glasses** in your armor slot.
Once worn, all enabled HUD features will automatically appear on your screen.

## 💬 Feedback & Contributions

Have ideas or feature suggestions?
Feel free to open an issue or contribute on [GitHub](https://github.com/Phalcode/minecraft-smart-glasses).

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
