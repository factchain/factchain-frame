/** @jsxImportSource frog/jsx */

import { Button, Frog, parseEther, TextInput } from 'frog'
// import { neynar } from 'frog/hubs'
import { handle } from 'frog/next'

type State = {
  castUrl: string;
  noteContent: string;
}

const app = new Frog<{ State: State }>({
  assetsPath: '/',
  basePath: '/api',
  initialState: {
    castUrl: '',
    noteContent: '',
  }
  // Supply a Hub to enable frame verification.
  // hub: neynar({ apiKey: 'NEYNAR_FROG_FM' })
})

const makeImage = (content: string[], footnote: string[]) => {
  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#393e46',
        fontSize: 35,
      }}
    >
      <div style={{ color: '#00adb5', fontSize: 70, fontWeight: 600, marginBottom: 100}}>Factchain</div>
      <div style={{
        color: 'white', 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        margin: 50
      }}>
        {content.map((item) => (
          <div style={{ color: 'white' }}>{item}</div>
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

app.frame('/', (c) => {
  console.log('handling /')
  return c.res({
    image: makeImage(["Factchain is a decentralized knowledge base.", "It allows you to create and view notes for any URL."], []),
    intents: [
      <Button value="view" action="/view-notes">View Factchain Notes</Button>,
      <Button value="new" action="/new-note">Create Factchain Note</Button>,
    ]
  })
})

app.frame('/view-notes', async (c) => {
  console.log('handling /view-notes')
  const { inputText } = c

  const castUrl = inputText || '';
  let content = '';
  let creator = '';
  if (castUrl) {
    const response = await fetch(`https://api.factchain.tech/notes?postUrl=${encodeURIComponent(castUrl)}`);
    const data = await response.json();
    if (data.notes.length > 0) {
      content = data.notes[0].content;
      creator = data.notes[0].creatorAddress;
    } else {
      content = '-- No notes found --';
      creator = '';
    }
  }

  return c.res({
    image: makeImage([content], [castUrl, creator]),
    intents: [
      <TextInput placeholder='Cast URL' />,
      <Button value='castUrl' action='/view-notes'>Look for notes</Button>,
      <Button.Reset>Restart</Button.Reset>,
    ],
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
  let content: string[] = [];
  let footnote: string[] = [];
  if (!state.castUrl) {
    action = '/new-note';
    intents = [
      <TextInput placeholder='Cast URL' />,
      <Button value='castUrl'>Enter Cast URL</Button>,
    ];
  } else if (!state.noteContent) {
    action = '/new-note';
    footnote = [state.castUrl];
    intents = [
      <TextInput placeholder='Note content' />,
      <Button value='noteContent'>Enter Note content</Button>,
    ];
  } else {
    action = '/finish';
    content = [state.noteContent];
    footnote = [state.castUrl];
    intents = [
      <Button.Transaction target='/publish-note'>Create Factchain Note</Button.Transaction>,
    ];
  }

  return c.res({
    action,
    image: makeImage(content, footnote),
    intents,
  })
})
 
app.transaction('/publish-note', (c) => {
  console.log('handling /publish-note')
  const { previousState } = c

  console.log(previousState)
  
  // Send transaction response.
  return c.send({
    chainId: 'eip155:8453',
    to: FACTCHAIN_ADDRESS,
    value: parseEther("0.001"),
    data: "0x",
    abi: FACTCHAIN_ABI
  })
})

app.frame('/finish', (c) => {
  console.log('handling /finish')
  const { transactionId } = c
  const txUrl = `https://basescan.com/tx/${transactionId}`

  let action = '/';
  let intents = [
    <Button.Link href={txUrl}>View transaction</Button.Link>,
    <Button.Reset>Restart</Button.Reset>,
  ];

  return c.res({
    action,
    image: (
      <div style={{ color: 'white', display: 'flex', fontSize: 60 }}>
        Transaction {transactionId} created
      </div>
    ),
    intents,
  })
})

// app.frame('/', (c) => {
//   const { inputText, deriveState } = c
//   const state = deriveState(previousState => {
//     if (inputText) previousState.value = inputText
//   })
//   const placeholder = `Value (ETH) - ${state.value}`;

//   return c.res({
//     action: 'https://d62b-37-169-90-157.ngrok-free.app/api/',
//     image: (
//       <div style={{ color: 'white', display: 'flex', fontSize: 60 }}>
//         Select amount
//       </div>
//     ),
//     intents: [
//       <TextInput placeholder={placeholder} />,
//       <Button value="next">Next</Button>,
//     ]
//   })
// })

// app.frame('/destination', (c) => {
//   const { inputText, deriveState } = c
//   const state = deriveState(previousState => {
//     previousState.value = inputText!
//   })

//   console.log(state)

//   return c.res({
//     action: 'https://d62b-37-169-90-157.ngrok-free.app/api/finish',
//     image: (
//       <div style={{ color: 'white', display: 'flex', fontSize: 60 }}>
//         Select destination
//       </div>
//     ),
//     intents: [
//       <TextInput placeholder='Destination' />,
//       <Button.Transaction target='https://d62b-37-169-90-157.ngrok-free.app/api/send-ether'>Next</Button.Transaction>,
//     ]
//   })
// })
 
// app.transaction('/send-ether', (c) => {
//   const { inputText, previousState } = c
//   const to = inputText!.replace('0x', '');

//   console.log(previousState)
//   console.log(to)
  
//   // Send transaction response.
//   return c.send({
//     chainId: 'eip155:8453',
//     to: `0x${to}`,
//     value: parseEther(previousState.value),
//   })
// })
 
// app.frame('/finish', (c) => {
//   const { transactionId } = c
//   return c.res({
//     image: (
//       <div style={{ color: 'white', display: 'flex', fontSize: 60 }}>
//         Transaction ID: {transactionId}
//       </div>
//     )
//   })
// })

export const GET = handle(app)
export const POST = handle(app)
