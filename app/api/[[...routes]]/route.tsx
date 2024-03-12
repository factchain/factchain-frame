/** @jsxImportSource frog/jsx */

import { Button, Frog, parseEther, TextInput } from 'frog'
// import { neynar } from 'frog/hubs'
import { handle } from 'frog/next'

type State = {
  castUrl: string;
  noteContent: string;
  noteCreator: `0x${string}`;
  rating: number;
  noteIndex: number;
}

const app = new Frog<{ State: State }>({
  assetsPath: '/',
  browserLocation: '/api/manifest',
  basePath: '/api',
  initialState: {
    castUrl: '',
    noteContent: '',
    noteCreator: '0x',
    rating: 3,
    noteIndex: 0,
  }
  // Supply a Hub to enable frame verification.
  // hub: neynar({ apiKey: 'NEYNAR_FROG_FM' })
})

const makeImage = (content: string[], footnote: string[], header = '') => {
  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1e242b',
        fontSize: 35,
      }}
    >
      <img 
        src="https://factchain.s3.eu-west-3.amazonaws.com/factchain-logo.png" 
        alt="Factchain Logo" 
        style={{ width: '50%', marginBottom: 20 }}
      />


      {header && (
        <div style={{
          color: '#00adb5',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 25
        }}>
          <div style={{ color: '#00adb5' }}>{header}</div>
        </div>
      )}

      <div style={{
        color: 'white', 
        display: 'flex',
        flexDirection: 'column',
        fontSize: '31px',
        fontFamily: 'Space Mono', // ignored
        justifyContent: 'flex-start', // ignored
        margin: 50
      }}> {content.map((item) => (
          <div style={{ color: 'white', margin: 3 }}>{item}</div>
        ))}
      </div>

      <div style={{
        color: '#00adb5',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 25
      }}>
        {footnote.map((item) => (
          <div style={{ color: '#00adb5' }}>{item}</div>
        ))}
      </div>
    </div>
  );
};

const FACTCHAIN_ADDRESS = '0xde31FB31adeB0a97E34aCf7EF4e21Ad585F667f7';
const FACTCHAIN_ABI = [
  {
    type: 'function',
    name: 'createNote',
    inputs: [
      {
        name: '_postUrl',
        type: 'string',
        internalType: 'string',
      },
      {
        name: '_content',
        type: 'string',
        internalType: 'string',
      },
    ],
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'minimumStakePerNote',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'uint64',
        internalType: 'uint64',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'minimumStakePerRating',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'uint64',
        internalType: 'uint64',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'rateNote',
    inputs: [
      {
        name: '_postUrl',
        type: 'string',
        internalType: 'string',
      },
      {
        name: '_creator',
        type: 'address',
        internalType: 'address',
      },
      {
        name: '_rating',
        type: 'uint8',
        internalType: 'uint8',
      },
    ],
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'userStats',
    inputs: [
      {
        name: '',
        type: 'address',
        internalType: 'address',
      },
    ],
    outputs: [
      {
        name: 'numberNotes',
        type: 'uint32',
        internalType: 'uint32',
      },
      {
        name: 'numberRatings',
        type: 'uint32',
        internalType: 'uint32',
      },
      {
        name: 'ethRewarded',
        type: 'uint96',
        internalType: 'uint96',
      },
      {
        name: 'ethSlashed',
        type: 'uint96',
        internalType: 'uint96',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'error',
    name: 'CantRateOwnNote',
    inputs: [],
  },
  {
    type: 'error',
    name: 'ContentInvalid',
    inputs: [],
  },
  {
    type: 'error',
    name: 'InsufficientStake',
    inputs: [],
  },
  {
    type: 'error',
    name: 'NoteAlreadyExists',
    inputs: [],
  },
  {
    type: 'error',
    name: 'NoteAlreadyFinalised',
    inputs: [],
  },
  {
    type: 'error',
    name: 'NoteDoesNotExist',
    inputs: [],
  },
  {
    type: 'error',
    name: 'PostUrlInvalid',
    inputs: [],
  },
  {
    type: 'error',
    name: 'RatingAlreadyExists',
    inputs: [],
  },
  {
    type: 'error',
    name: 'RatingInvalid',
    inputs: [],
  }
] as const;

app.get('/manifest', (c) => {
  return c.redirect('https://factchain.tech')
})

app.frame('/', async (c) => {
  console.log('handling /')
  const { url, deriveState } = c

  let intents = [
    <Button value="new" action="/new-note">Add note to a cast</Button>,
    <Button value="view" action="/view-notes">Check notes on a cast</Button>,
  ];
  
  if (url) {
    const response = await fetch(
      `https://api.neynar.com/v2/farcaster/cast?identifier=${encodeURIComponent(url)}&type=url`, {
        headers: {
          'Content-Type': 'application/json',
          'api_key': process.env.NEYNAR_API_KEY!,
        }
      }
    );
    const parentUrl = (await response.json()).cast.parent_url;
    if (parentUrl) {
      deriveState(previousState => {
        previousState.castUrl = parentUrl;
      });
      intents = [
        <Button value="new" action="/new-note">Add note to parent cast</Button>,
        <Button value="view-parent" action="/view-notes">Check notes on parent cast</Button>,
      ];
    } else {
      console.log('No parentUrl');
    }
  } else {
    console.log('No url?');
  }

  return c.res({
    image: makeImage([
      'Sufficiently decentralized community notes.',
      'Add context to potentially misleading posts.',
      'Rate Factchainers notes. Onchain.',
      'Get ETH rewards for creating a better informed Warpcast.',
      'Ready to put your ETH where your mouth is?',
    ], []),
    intents
  })
})

app.frame('/view-notes', async (c) => {
  console.log('handling /view-notes')
  const { buttonValue, inputText, deriveState } = c
  let state = deriveState(previousState => {
    if (buttonValue === "view") {
      previousState.castUrl = '';
      previousState.noteIndex = 0;
    } else if (buttonValue === "view-parent") {
      previousState.noteIndex = 0;
    } else if (buttonValue === "castUrl") {
      previousState.castUrl = inputText!;
      previousState.noteIndex = 0;
    } else if (buttonValue === "next") {
      previousState.noteIndex += 1;
    } else if (buttonValue === "previous") {
      previousState.noteIndex -= 1;
    }
    previousState.noteContent = '';
    previousState.noteCreator = '0x';
  })

  let intents = [
    <TextInput placeholder='Enter Cast URL' />,
    <Button value='castUrl' action='/view-notes'>Confirm Cast URL</Button>,
  ]
  let content: string[] = [
    'Have you come across a cast that could use some additional context?',
    "Let's check it for Factchain notes!"
  ];

  let footnote: string[] = [];
  let header = "";
  if (state.castUrl) {
    const response = await fetch(
      `https://api.factchain.tech/notes?postUrl=${encodeURIComponent(state.castUrl)}`, {
        headers: {
          'Content-Type': 'application/json',
          'network': 'BASE_MAINNET',
        }
      }
    );
    let notes = (await response.json()).notes;
    notes.sort((a: any, b: any) => b.finalRating - a.finalRating);
    if (notes.length > 0) {
      intents = [
        <Button value="rate" action="/rate-note">Rate note</Button>,
      ];
      state = deriveState(previousState => {
        previousState.noteContent = notes[state.noteIndex].content;
        previousState.noteCreator = notes[state.noteIndex].creatorAddress;
      })
      header = state.castUrl;
      content = [state.noteContent];
      footnote = [state.noteCreator]; 

      if (state.noteIndex > 0) {
        intents.push(<Button value="previous" action="/view-notes">Previous note</Button>);
      }
      if (state.noteIndex < notes.length - 1) {
        intents.push(<Button value="next" action="/view-notes">Next note</Button>);
      }
    } else {
      content = ["This cast doesn't have any Factchain notes yet."]
      footnote = [];
      intents = [<Button value="new" action="/new-note">Add a note</Button>];
    }
  }

  intents.push(<Button.Reset>Restart</Button.Reset>);
  return c.res({
    image: makeImage(content, footnote, header),
    intents,
  })
})

app.frame('/new-note', (c) => {
  console.log('handling /new-note')
  const { inputText, buttonValue, deriveState } = c
  const state = deriveState(previousState => {
    if (inputText) {
      if (buttonValue === "castUrl") previousState.castUrl = inputText
      if (buttonValue === "noteContent") previousState.noteContent = inputText
    }
  })

  let action = '';
  let intents = [];
  let header = '';
  let content: string[] = [
    'Have you come across a cast that could use some additional context?',
    "Let's add a Factchain note!"
  ];
  let footnote: string[] = [];
  if (!state.castUrl) {
    action = '/new-note';
    intents = [
      <TextInput placeholder='Enter Cast URL' />,
      <Button value='castUrl'>Confirm Cast URL</Button>,
    ];
  } else if (!state.noteContent) {
    action = '/new-note';
    content = [
      'Add context to this post.',
      'Explain the evidence behind your choices,',
      'and provide links to outside sources.'
    ];
    header = state.castUrl;
    intents = [
      <TextInput placeholder='Note content' />,
      <Button value='noteContent'>Enter note content</Button>,
    ];
  } else {
    action = '/finish';
    content = [state.noteContent];
    header = state.castUrl;
    intents = [
      <Button.Transaction target='/publish-note'>Publish note</Button.Transaction>,
    ];
  }

  intents.push(<Button.Reset>Restart</Button.Reset>);
  return c.res({
    action,
    image: makeImage(content, footnote, header),
    intents,
  })
})
 
app.transaction('/publish-note', (c) => {
  console.log('handling /publish-note')
  const { previousState } = c

  console.log(previousState)
  
  // Send transaction response.
  return c.contract({
    chainId: 'eip155:8453',
    to: FACTCHAIN_ADDRESS,
    value: parseEther("0.001"),
    functionName: 'createNote',
    args: [previousState.castUrl, previousState.noteContent],
    abi: FACTCHAIN_ABI,
  })
})
 
app.frame('/rate-note', (c) => {
  console.log('handling /rate-note')
  const { previousState } = c

  return c.res({
    action: '/finish',
    image: makeImage([previousState.noteContent], [previousState.noteCreator], previousState.castUrl),
    intents: [
      <TextInput placeholder='Rating (1-5)' />,
      <Button.Transaction target='/publish-rating'>Publish rating</Button.Transaction>,
      <Button.Reset>Restart</Button.Reset>,
    ],
  })
})
 
app.transaction('/publish-rating', (c) => {
  console.log('handling /publish-rating')
  const { inputText, previousState } = c
  const rating = parseInt(inputText!);
  console.log(previousState)
  
  // Send transaction response.
  return c.contract({
    chainId: 'eip155:8453',
    to: FACTCHAIN_ADDRESS,
    value: parseEther("0.0001"),
    functionName: 'rateNote',
    args: [previousState.castUrl, previousState.noteCreator, rating],
    abi: FACTCHAIN_ABI,
  })
})

app.frame('/finish', (c) => {
  console.log('handling /finish')
  const { transactionId } = c
  const txUrl = `https://basescan.org/tx/${transactionId}`

  let action = '/';
  let intents = [
    <Button.Link href={txUrl}>View transaction</Button.Link>,
    <Button.Reset>Restart</Button.Reset>,
  ];

  return c.res({
    action,
    image: makeImage(['Note successfuly published'], []),
    intents,
  })
})

export const GET = handle(app)
export const POST = handle(app)
