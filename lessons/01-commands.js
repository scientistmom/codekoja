// One complete lesson. Text pairs are [English, Hungarian].
window.PipLessonRegistry.register({
  "schemaVersion": 1,
  "id": "commands",
  "label": [
    "Commands",
    "Parancsok"
  ],
  "title": [
    "Commands in order",
    "Parancsok sorban"
  ],
  "summary": {
    "idea": [
      "Koja follows commands in order: move one square or turn on the spot.",
      "Koja sorban követi a parancsokat: lép egy mezőt, vagy helyben elfordul."
    ],
    "vocabulary": [
      "forward()",
      "left()",
      "right()"
    ]
  },
  "tools": [],
  "practice": {
    "read": "actions",
    "write": "easy"
  },
  "stages": [
    {
      "scenario": {
        "width": 5,
        "height": 5,
        "start": {
          "row": 3,
          "column": 1,
          "direction": "up"
        },
        "goal": null,
        "obstacles": []
      },
      "kind": "watch",
      "program": [
        "forward()",
        "right()",
        "forward()"
      ],
      "focus": {
        "en": {
          "preview": [
            [
              1,
              3,
              1,
              null
            ]
          ]
        },
        "hu": {
          "preview": [
            [
              1,
              3,
              1,
              null
            ]
          ]
        }
      }
    },
    {
      "scenario": {
        "width": 5,
        "height": 5,
        "start": {
          "row": 3,
          "column": 3,
          "direction": "left"
        },
        "goal": null,
        "obstacles": []
      },
      "kind": "predict",
      "program": [
        "forward()",
        "left()",
        "forward()",
        "right()",
        "forward()"
      ]
    },
    {
      "editable": true,
      "scenario": {
        "width": 5,
        "height": 5,
        "start": {
          "row": 4,
          "column": 1,
          "direction": "up"
        },
        "goal": {
          "row": 3,
          "column": 2
        },
        "obstacles": [],
        "coins": [
          [
            3,
            1
          ]
        ]
      },
      "kind": "complete",
      "program": [
        "forward()",
        "",
        "forward()"
      ],
      "focus": {
        "en": {
          "preview": [
            [
              2,
              2,
              1,
              2
            ]
          ]
        },
        "hu": {
          "preview": [
            [
              2,
              2,
              1,
              2
            ]
          ]
        }
      },
      "solutions": [
        [
          "forward()",
          "right()",
          "forward()"
        ]
      ],
      "editSelection": {
        "en": [
          2,
          1,
          1
        ],
        "hu": [
          2,
          1,
          1
        ]
      },
      "revision": 3
    },
    {
      "editable": true,
      "scenario": {
        "width": 5,
        "height": 5,
        "start": {
          "row": 3,
          "column": 3,
          "direction": "left"
        },
        "goal": {
          "row": 1,
          "column": 2
        },
        "obstacles": [],
        "coins": [
          [
            3,
            2
          ]
        ]
      },
      "kind": "create",
      "program": [
        ""
      ],
      "solutions": [
        [
          "forward()",
          "right()",
          "forward()",
          "forward()"
        ]
      ],
      "revision": 3
    }
  ]
});
