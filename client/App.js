
// client/src/App.js
import React, { Component } from "react";
import {
    BrowserRouter as Router,
    Route,
    Switch,
    Link,
    Redirect
} from "react-router-dom";
import SignUp from './pages/signUp.js';
import SignIn from './pages/signIn.js';

class App extends Component {
    render() {
        return(
            <Router>
                <Switch>
                    <Route exact path="/" ><SignUp /></Route>
                    <Route path="/signIn"><SignIn /></Route>
                </Switch>
            </Router>
        );
    }
}

export default App;
