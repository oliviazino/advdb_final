/* Home Page - Routed Container Component */
import NewEvents from './NewEvents.jsx'
import { Box, Container, Typography, Paper, Divider, Grow } from '@mui/material'

function Home() {
    // display home page using MUI components
    return (
        <Container sx={{ marginTop: 4 }}>
            {/* display reslife info on mui paper elements */}
            <Grow in={true} timeout={500}>
            <Paper sx={{ backgroundColor: 'white', padding: 2 }}>
                <Typography variant="h1" color="primary.main">
                    Amtracker
                </Typography>
                <Typography variant="body1" color="primary.main" sx={{ marginTop: 1 }}>
                    The Amtracker was designed for CSE 40746 as a solution to the poor delay notification and existing booking systems offered by the company.
                </Typography>
            </Paper>
            </Grow>
            <Grow in={true} timeout={500}>
            <Paper sx={{ backgroundColor: 'white', padding: 2, marginTop: 2 }}>
                <Typography variant="h3" color="primary.main">
                        Stay up-to-date with the newest events below:
                    </Typography>
            </Paper>
            </Grow>
            {/* display newest events */}
            <NewEvents/>
        </Container>
    )
}

export default Home
