// One complete lesson. Text pairs are [English, Hungarian].
window.PipLessonRegistry.register({
  "schemaVersion": 1,
  "id": "nested-for",
  "label": [
    "Nested for",
    "for a for-ban"
  ],
  "title": [
    "Finish the inner loop each time",
    "Minden körben fejezd be a belső ciklust"
  ],
  "summary": {
    "idea": [
      "Put one `for` inside another: the inner loop runs from start to finish on each outer repetition.",
      "Tegyél egy `for` ciklust egy másikba: a belső ciklus a külső minden ismétlésében végigfut."
    ],
    "blocksIdea": [
      "Put one repeat group inside another: finish the inner group on every outer repetition.",
      "Tegyél egy ismétlőcsoportot egy másikba: a belső csoport a külső minden körében végigfut."
    ],
    "vocabulary": [
      "for + for",
      "range",
      "indentation"
    ]
  },
  "tools": [
    "nested",
    "variable",
    "update"
  ],
  "practice": {
    "read": "while",
    "write": "hard"
  },
  "stages": [
    {
      "kind": "watch",
      "program": [
        "for side in range(2):",
        "    for step in range(3):",
        "        forward()",
        "    right()"
      ],
      "scenario": {
        "width": 5,
        "height": 5,
        "start": {
          "row": 4,
          "column": 0,
          "direction": "up"
        },
        "goal": null,
        "obstacles": []
      },
      "focus": {
        "en": {
          "preview": [
            [
              1
            ]
          ]
        },
        "hu": {
          "preview": [
            [
              1
            ]
          ]
        }
      },
      "revision": 4
    },
    {
      "kind": "predict",
      "program": [
        "distance = 1",
        "for side in range(2):",
        "    for step in range(distance):",
        "        forward()",
        "    distance += 1",
        "    left()"
      ],
      "scenario": {
        "width": 5,
        "height": 5,
        "start": {
          "row": 3,
          "column": 3,
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
        "for side in range(3):",
        "    for step in range(3):",
        "        forward()",
        "        right()"
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
          "column": 3
        },
        "obstacles": [],
        "coins": [
          [
            1,
            0
          ],
          [
            1,
            3
          ]
        ]
      },
      "solutions": [
        [
          "for side in range(3):",
          "    for step in range(3):",
          "        forward()",
          "    right()"
        ]
      ],
      "focus": {
        "en": {
          "preview": [
            [
              4,
              4,
              5,
              9
            ]
          ]
        },
        "hu": {
          "preview": [
            [
              4,
              4,
              5,
              9
            ]
          ]
        }
      },
      "editSelection": {
        "en": [
          4,
          5,
          9
        ],
        "hu": [
          4,
          5,
          9
        ]
      },
      "revision": 3
    },
    {
      "kind": "create",
      "editable": true,
      "program": [],
      "scenario": {
        "width": 5,
        "height": 5,
        "start": {
          "row": 3,
          "column": 1,
          "direction": "up"
        },
        "goal": {
          "row": 3,
          "column": 0
        },
        "obstacles": [
          [
            2,
            2
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
          ],
          [
            3,
            3
          ]
        ]
      },
      "solutions": [
        [
          "for side in range(4):",
          "    for step in range(2):",
          "        forward()",
          "    right()",
          "left()",
          "forward()"
        ]
      ],
      "revision": 4,
      "commentTranslations": [
        [
          "# Use an inner loop for the steps along one side.",
          "# A belső ciklus járjon végig egy oldalt."
        ],
        [
          "# Use an outer loop to repeat the side and the turn.",
          "# A külső ciklus ismételje az oldalt és a fordulást."
        ]
      ],
      "legacyCoins": [
        [
          1,
          0
        ],
        [
          1,
          3
        ]
      ]
    }
  ]
});
