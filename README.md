# media-browser-card

A custom media browser card for the Home Assistant Lovelace UI. The card provides similar functionality as the media browser panel that ships with Home Assistant itself.

**Features**
- Browse media folders
- Play media files on the selected media player, or in a browser tab
- Shows currently playing media item
- Shows which items have already been played
- Keeps current directory between reloads

**Screenshot**

![Screenshot](/docs/screenshot.png?raw=true "Screenshot")

## Installation

The instructions follow the basic steps that are described by the [Lovelace: Custom cards](https://developers.home-assistant.io/docs/frontend/custom-ui/lovelace-custom-card) documentation.

1. Copy the `media-browser-card.js` file from this repository into your Home Assistant config directory as `<config>/www/media-browser-card.js`
2. Add the file as a resource to your Lovelace configuration. In the Home Assistant UI, go to `Settings > Lovelace Dashboard > Resources Tab`. Add a new resource, set the URL to `/local/media-browser-card.js`, and the resource type to `Javascript-Module`. Save.
3. Edit the Lovelace Dashboard where you want to use the card. Add a new manual / custom card, and use the following YAML configuration:
    ```
    type: custom:media-browser-card
    ```
