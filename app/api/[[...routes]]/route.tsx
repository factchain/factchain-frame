/** @jsxImportSource frog/jsx */

import { Button, Frog, parseEther, TextInput } from 'frog'
// import { neynar } from 'frog/hubs'
import { handle } from 'frog/next'

type State = {
  amount: string;
  destination: `0x${string}`;
}

const app = new Frog<{ State: State }>({
  assetsPath: '/',
  basePath: '/api',
  initialState: {
    amount: '',
    destination: '0x',
  }
  // Supply a Hub to enable frame verification.
  // hub: neynar({ apiKey: 'NEYNAR_FROG_FM' })
})

// Uncomment to use Edge Runtime
// export const runtime = 'edge'
 
app.frame('/', (c) => {
  console.log('handling /')
  const { inputText, buttonValue, deriveState } = c
  const state = deriveState(previousState => {
    if (buttonValue == "reset") {
      previousState.amount = ''
      previousState.destination = '0x'
    }
    else if (inputText) {
      if (buttonValue == "amount") previousState.amount = inputText
      if (buttonValue == "destination") previousState.destination = `0x${inputText.replace('0x', '')}`
    }
  })

  let action = '';
  let intents = [<Button value='reset'>Bad reset</Button>];
  if (!state.amount) {
    action = '/';
    intents = [
      <TextInput placeholder='Amount (ETH)' />,
      <Button value='amount'>Select amount</Button>,
    ];
  } else if (state.destination === '0x') {
    action = '/';
    intents = [
      <TextInput placeholder='Destination' />,
      <Button value='destination'>Select destination</Button>,
    ];
  // } else {
  //   action = '/finish';
  //   intents = [<Button value='send'>Send</Button>];
  // }
  } else {
    action = '/finish';
    intents = [
      <Button.Transaction target='/send-ether'>Send</Button.Transaction>,
    ];
  }

  return c.res({
    action,
    image: (
      <div style={{ color: 'white', display: 'flex', fontSize: 60 }}>
        {JSON.stringify(state)}
      </div>
    ),
    intents,
  })
})
 
app.transaction('/send-ether', (c) => {
  console.log('handling /send-ether')
  const { previousState } = c

  console.log(previousState)
  
  // Send transaction response.
  return c.send({
    chainId: 'eip155:8453',
    to: previousState.destination,
    value: parseEther(previousState.amount),
  })
})

app.frame('/finish', (c) => {
  console.log('handling /finish')
  const { previousState } = c

  let action = '/';
  let intents = [<Button value='reset'>Good reset</Button>];

  return c.res({
    action,
    image: (
      <div style={{ color: 'white', display: 'flex', fontSize: 60 }}>
        {JSON.stringify(previousState)}
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
