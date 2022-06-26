// https://www.youtube.com/watch?v=JaVu-sS3ixg
import React, { useState, useEffect } from 'react'
import './App.css';
import { Auth, Hub } from 'aws-amplify'

const initialFormState = { username: '', password: '', email: '', authCode: '', formType: 'signUp' }
function App() {
  const [formState, setFormState] = useState(initialFormState)
  const [user, setUser] = useState(null)
  const [userSub, setUserSub] = useState('')
  useEffect(() => {
    checkUser()
    setAuthListener()
  }, [])
  async function setAuthListener() {
    const listener = (data) => {
      switch (data.payload.event) {
        case 'signIn':
          checkUser()
          console.log('user signed in');        
          break;
        case 'signUp':
          console.log('user signed up');
          break;
        case 'signOut':
          setFormState(() => ({ ...formState, formType: "signIn" }))
          break;
        case 'signIn_failure':
          console.log('user sign in failed');
          break;
        case 'tokenRefresh':
          console.log('token refresh succeeded');
          break;
        case 'tokenRefresh_failure':
          console.log('token refresh failed');
          break;
        case 'configured':
          console.log('the Auth module is configured');
          break
        default:
          break
      }
    }

    Hub.listen('auth', listener);
  }
  async function checkUser() {
    try {
      const user = await Auth.currentAuthenticatedUser()
      setUser(user)
      console.log(user)
      setUserSub(user.attributes.sub)
      setFormState(() => ({ ...formState, formType: "signedIn" }))
    } catch (err) {
      setUser(null)
    }
  }
  const onChange = (event) => {
    event.persist()
    setFormState(() => ({ ...formState, [event.target.name]: event.target.value }))
  }
  const { formType } = formState

  async function signUp() {
    const { username, email, password } = formState;
    await Auth.signUp({ username, password })
    setFormState(() => ({ ...formState, formType: "signIn" }))
  }
  async function confirmSignUp() {
    const { username, authCode } = formState;
    console.log(authCode)
    await Auth.confirmSignUp(username, authCode)
    setFormState(() => ({ ...formState, formType: "signIn" }))
  }
  async function signIn() {
    const { username, password } = formState;
    const user = await Auth.signIn(username, password)    
    setFormState(() => ({ ...formState, formType: "signedIn" }))
  }
  return (
    <div className="App">
      {formType === 'signUp' && (
        <div>
          <input name="username" onChange={onChange} placeholder="username" />
          <input name="password" onChange={onChange} placeholder="password" />
          <input name="email" onChange={onChange} placeholder="email" />
          <button onClick={signUp}>Sign up</button>
          <button onClick={() => setFormState(() => ({ ...formState, formType: "signIn" }))}>Sign In</button>
        </div>
      )}
      {formType === 'confirmSignUp' && (
        <div>
          <input name="authCode" onChange={onChange} placeholder="Confirmation code" />
          <button onClick={confirmSignUp}>Confirm Sign up</button>
        </div>
      )}
      {formType === 'signIn' && (
        <div>
          <input name="username" onChange={onChange} placeholder="username" />
          <input name="password" onChange={onChange} placeholder="password" />
          <button onClick={signIn}>Sign In</button>
          <button onClick={() => setFormState(() => ({ ...formState, formType: "signUp" }))}>Sign Up</button>
        </div>
      )}

      {formType === 'signedIn' && (
        <div>
          <p>Hello there, user {userSub}</p>
          <button onClick={() => {
            Auth.signOut()
            setFormState(() => ({ ...formState, formType: "signIn" }))
          }
          }>Sign out</button>
        </div>
      )}

    </div>
  );
}

export default App;
