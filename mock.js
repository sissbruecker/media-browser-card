const mockBrowserMediaResult = {
  "title": "letsplay/",
  "media_class": "directory",
  "media_content_type": "",
  "media_content_id": "media-source://media_source/local/letsplay",
  "can_play": false,
  "can_expand": true,
  "children_media_class": "video",
  "thumbnail": null,
  "children": [
    {
      "title": "Bumbling Through Man of Medan p.1-o6-tDuoj87E.mp4",
      "media_class": "video",
      "media_content_type": "video/mp4",
      "media_content_id": "media-source://media_source/local/letsplay/Bumbling Through Man of Medan p.1-o6-tDuoj87E.mp4",
      "can_play": true,
      "can_expand": false,
      "children_media_class": null,
      "thumbnail": null
    },
    {
      "title": "Bumbling Through Man of Medan p.2-TdPYdJeX0Oc.mp4",
      "media_class": "video",
      "media_content_type": "video/mp4",
      "media_content_id": "media-source://media_source/local/letsplay/Bumbling Through Man of Medan p.2-TdPYdJeX0Oc.mp4",
      "can_play": true,
      "can_expand": false,
      "children_media_class": null,
      "thumbnail": null
    },
    {
      "title": "Bumbling Through Man of Medan p.3 (THEATRICAL CUT END)-oAqF31hAWEk.mp4",
      "media_class": "video",
      "media_content_type": "video/mp4",
      "media_content_id": "media-source://media_source/local/letsplay/Bumbling Through Man of Medan p.3 (THEATRICAL CUT END)-oAqF31hAWEk.mp4",
      "can_play": true,
      "can_expand": false,
      "children_media_class": null,
      "thumbnail": null
    },
    {
      "title": "Bumbling Through Man of Medan p.4-D5DuzyAjx8o.mp4",
      "media_class": "video",
      "media_content_type": "video/mp4",
      "media_content_id": "media-source://media_source/local/letsplay/Bumbling Through Man of Medan p.4-D5DuzyAjx8o.mp4",
      "can_play": true,
      "can_expand": false,
      "children_media_class": null,
      "thumbnail": null
    },
    {
      "title": "Bumbling Through Man of Medan p.5-s-8x-EmIUTU.mp4",
      "media_class": "video",
      "media_content_type": "video/mp4",
      "media_content_id": "media-source://media_source/local/letsplay/Bumbling Through Man of Medan p.5-s-8x-EmIUTU.mp4",
      "can_play": true,
      "can_expand": false,
      "children_media_class": null,
      "thumbnail": null
    },
    {
      "title": "Bumbling Through Man of Medan p.6 (FINAL)-sbqasZQFr3Q.mp4",
      "media_class": "video",
      "media_content_type": "video/mp4",
      "media_content_id": "media-source://media_source/local/letsplay/Bumbling Through Man of Medan p.6 (FINAL)-sbqasZQFr3Q.mp4",
      "can_play": true,
      "can_expand": false,
      "children_media_class": null,
      "thumbnail": null
    }
  ]
};

const mockDirectoryResult = {
  "title": "media/",
  "media_class": "directory",
  "media_content_type": "",
  "media_content_id": "media-source://media_source/local/.",
  "can_play": false,
  "can_expand": true,
  "children_media_class": "directory",
  "thumbnail": null,
  "children": [
    {
      "title": "letsplay/",
      "media_class": "directory",
      "media_content_type": "",
      "media_content_id": "media-source://media_source/local/letsplay",
      "can_play": false,
      "can_expand": true,
      "children_media_class": null,
      "thumbnail": null
    },
    {
      "title": "stuff/",
      "media_class": "directory",
      "media_content_type": "",
      "media_content_id": "media-source://media_source/local/stuff",
      "can_play": false,
      "can_expand": true,
      "children_media_class": null,
      "thumbnail": null
    }
  ]
};

export const hassMock = {
  states: {
    "mediaplayer.chromecast_ultra": {
      attributes: {
        media_content_id: "\"http://192.168.178.40:8123/media/local/letsplay/Bumbling%20Through%20Man%20of%20Medan%20p.2-TdPYdJeX0Oc.mp4?authSig=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJhZWY4MmFmNzU4ZmI0N2Q0YTJlZjI2NzRlODM4MDY1NiIsInBhdGgiOiIvbWVkaWEvbG9jYWwvbGV0c3BsYXkvQnVtYmxpbmcgVGhyb3VnaCBNYW4gb2YgTWVkYW4gcC4yLVRkUFlkSmVYME9jLm1wNCIsImlhdCI6MTYzNjI0NTk1NiwiZXhwIjoxNjM2MzMyMzU2fQ.-TH-Bb0Pi0CsS_VFnbObQbwqqIlhTveNRb10rZFiRxQ\""
      }
    }
  },
  async callWS(request) {
    if (request.type === "media_source/browse_media")
      if (request.media_content_id)
        return mockBrowserMediaResult;
      else {
        return mockDirectoryResult;
      }
  },
  async callService() {
  }
};
