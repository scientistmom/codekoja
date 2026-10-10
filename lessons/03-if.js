// One complete lesson. Text pairs are [English, Hungarian].
window.PipLessonRegistry.register({
  "schemaVersion": 1,
  "id": "if",
  "label": [
    "if",
    "if"
  ],
  "title": [
    "Choose by looking",
    "Válassz a pálya alapján"
  ],
  "summary": {
    "idea": [
      "`if` chooses what to do from what Koja sees; `else` runs when the condition is false.",
      "Az `if` Koja környezete alapján dönt; az `else` akkor fut le, ha a feltétel hamis."
    ],
    "blocksIdea": [
      "Run the blocks inside `if` only when its condition is true; otherwise skip them.",
      "Csak akkor hajtsd végre az `if` blokk parancsait, ha a feltétele igaz; különben hagyd ki őket."
    ],
    "vocabulary": [
      "if",
      "else",
      "=="
    ]
  },
  "tools": [
    "whats",
    "if",
    "else"
  ],
  "practice": {
    "read": "if",
    "write": "medium"
  },
  "observation": {
    "direction": "ahead",
    "from": "start"
  },
  "stages": [
    {
      "kind": "watch",
      "program": [
        "if whats(\"ahead\") == \"wall\":",
        "    right()",
        "else:",
        "    forward()",
        "forward()"
      ],
      "scenario": {
        "width": 5,
        "height": 5,
        "start": {
          "row": 0,
          "column": 1,
          "direction": "up"
        },
        "goal": null,
        "obstacles": []
      },
      "focus": {
        "en": {
          "preview": [
            [
              1,
              2,
              1,
              null
            ]
          ]
        },
        "hu": {
          "preview": [
            [
              1,
              2,
              1,
              null
            ]
          ]
        }
      }
    },
    {
      "kind": "predict",
      "program": [
        "if whats(\"ahead\") == \"wall\":",
        "    right()",
        "else:",
        "    forward()",
        "forward()"
      ],
      "scenario": {
        "width": 5,
        "height": 5,
        "start": {
          "row": 3,
          "column": 2,
          "direction": "up"
        },
        "goal": null,
        "obstacles": []
      }
    },
    {
      "kind": "complete",
      "editable": true,
      "program": [
        "for step in range(7):",
        "    if whats(\"ahead\") == \"obstacle\":",
        "        ",
        "    forward()"
      ],
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
          "column": 3
        },
        "obstacles": [
          [
            0,
            1
          ],
          [
            1,
            4
          ]
        ],
        "coins": [
          [
            1,
            1
          ],
          [
            1,
            3
          ]
        ]
      },
      "solutions": [
        [
          "for step in range(7):",
          "    if whats(\"ahead\") == \"obstacle\":",
          "        right()",
          "    forward()"
        ]
      ],
      "focus": {
        "en": {
          "preview": [
            [
              3,
              3,
              9,
              10
            ]
          ]
        },
        "hu": {
          "preview": [
            [
              3,
              3,
              9,
              10
            ]
          ]
        }
      },
      "editSelection": {
        "en": [
          3,
          9,
          9
        ],
        "hu": [
          3,
          9,
          9
        ]
      },
      "revision": 3
    },
    {
      "kind": "create",
      "editable": true,
      "program": [
        ""
      ],
      "scenario": {
        "width": 5,
        "height": 5,
        "start": {
          "row": 4,
          "column": 0,
          "direction": "up"
        },
        "goal": {
          "row": 4,
          "column": 4
        },
        "obstacles": [],
        "coins": [
          [
            0,
            0
          ],
          [
            0,
            4
          ]
        ]
      },
      "solutions": [
        [
          "for step in range(12):",
          "    if whats(\"ahead\") == \"wall\":",
          "        right()",
          "    forward()"
        ]
      ],
      "revision": 3
    }
  ]
});
