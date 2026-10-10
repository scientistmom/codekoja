// One complete lesson. Text pairs are [English, Hungarian].
window.PipLessonRegistry.register({
  "schemaVersion": 1,
  "id": "parameters",
  "label": [
    "Inputs",
    "Bemenetek"
  ],
  "title": [
    "Give a function an input and get an answer",
    "Adj bemenetet a függvénynek, és kapj választ"
  ],
  "summary": {
    "idea": [
      "Give a function a value to work with, then use the value it sends back with `return`.",
      "Adj egy értéket a függvénynek, majd használd fel a `return` segítségével visszakapott értéket."
    ],
    "vocabulary": [
      "parameter",
      "argument",
      "return"
    ]
  },
  "tools": [
    "parameter",
    "call",
    "return",
    "for"
  ],
  "practice": {
    "read": "while",
    "write": "medium"
  },
  "stages": [
    {
      "kind": "watch",
      "program": [
        "def walk(distance):",
        "    for step in range(distance):",
        "        forward()",
        "    return distance + 1",
        "",
        "next_distance = walk(2)",
        "right()",
        "walk(next_distance)"
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
              1,
              4,
              1,
              null
            ]
          ]
        },
        "hu": {
          "preview": [
            [
              1,
              4,
              1,
              null
            ]
          ]
        }
      },
      "revision": 4
    },
    {
      "kind": "predict",
      "program": [
        "def double(number):",
        "    return number * 2",
        "",
        "distance = double(2)",
        "for step in range(distance):",
        "    forward()",
        "left()"
      ],
      "scenario": {
        "width": 5,
        "height": 5,
        "start": {
          "row": 4,
          "column": 3,
          "direction": "up"
        },
        "goal": null,
        "obstacles": []
      },
      "revision": 3
    },
    {
      "kind": "complete",
      "editable": true,
      "program": [
        "def walk(distance):",
        "    for step in range(distance):",
        "        forward()",
        "    ",
        "",
        "next_distance = walk(3)",
        "right()",
        "walk(next_distance)"
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
          "row": 1,
          "column": 4
        },
        "obstacles": [],
        "coins": [
          [
            2,
            0
          ]
        ]
      },
      "solutions": [
        [
          "def walk(distance):",
          "    for step in range(distance):",
          "        forward()",
          "    return distance + 1",
          "",
          "next_distance = walk(3)",
          "right()",
          "walk(next_distance)"
        ]
      ],
      "focus": {
        "en": {
          "preview": [
            [
              4,
              4,
              5,
              6
            ]
          ]
        },
        "hu": {
          "preview": [
            [
              4,
              4,
              5,
              6
            ]
          ]
        }
      },
      "editSelection": {
        "en": [
          4,
          5,
          5
        ],
        "hu": [
          4,
          5,
          5
        ]
      },
      "revision": 4
    },
    {
      "kind": "create",
      "editable": true,
      "program": [],
      "scenario": {
        "width": 5,
        "height": 5,
        "start": {
          "row": 4,
          "column": 0,
          "direction": "up"
        },
        "goal": {
          "row": 3,
          "column": 1
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
            0
          ],
          [
            1,
            4
          ],
          [
            3,
            4
          ]
        ]
      },
      "solutions": [
        [
          "def walk(distance):",
          "    for step in range(distance):",
          "        forward()",
          "    return distance + 1",
          "",
          "next_distance = walk(3)",
          "right()",
          "walk(next_distance)",
          "right()",
          "next_distance = walk(2)",
          "right()",
          "walk(next_distance)"
        ]
      ],
      "revision": 4,
      "commentTranslations": [
        [
          "# Define walk(distance) for that many steps.",
          "# A walk(distance) ennyi lépést tegyen meg."
        ],
        [
          "# Call it for each stretch of the coin route.",
          "# Hívd meg az érmeút minden szakaszára."
        ]
      ]
    }
  ]
});
