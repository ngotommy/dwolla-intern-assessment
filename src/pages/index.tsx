import Head from 'next/head';
import useSWR, { mutate } from 'swr';
import { useState } from 'react';
import { 
  Box, Table, TableHead, TableBody, TableRow,
  TableCell, Dialog, DialogTitle, DialogActions, 
  TextField, Typography, Button, Snackbar
} from '@mui/material';
// Icon for Add Customer button
import { AddRounded } from '@mui/icons-material';

export type Customer = {
  firstName: string;
  lastName: string;
  email: string;
  businessName?: string;
};

export type Customers = Customer[];

export type ApiError = {
  code: string;
  message: string;
};

/* Component: InputField
* Creates a text field for the dialog
* 
* @param id: string: id of the input field
* @param label: string: label of the input field
* @param value: string: value of the input field
* @param onChange: (e: React.ChangeEvent<HTMLInputElement>) => void: function to handle changes the user makes to input field
* @param required: boolean: whether the input field is required
*/
const InputField = ({ id, label, value, onChange, required = true }: { 
  id: string,
  label: string,
  value: string,
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
  required?: boolean,
}) => (
  <TextField
    margin="normal"
    id={id}
    label={label}
    value={value}
    onChange={onChange}
    variant="outlined"
    fullWidth
    required={required}
  />
);

/* Component: CreateDialog
* Creates a modal dialog popup for adding a new customer
* 
* @param open: boolean: whether the dialog is open or not
* @param handleClose: () => void: function to handle closing the dialog
*/
const CreateDialog = ({ open, handleClose }: { open: boolean, handleClose: () => void }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  /* Function: handleSnackbarClose
  * closes the snackbar
  */
  const handleSnackbarClose = () => setSnackbarOpen(false);

  /* Function: showSnackbar
  * displays a snackbar with the given message
  *
  * @param message: string: message to display in the snackbar
  */
  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  }

  /* Function: handleSubmit
  * sends a POST request to the server to add a new customer
  */
  const handleSubmit = async () => {
    const customerData = { firstName, lastName, email, businessName: businessName || undefined};
    
    try {
      const requestOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', 
        },
        body: JSON.stringify(customerData),
      };
  
      const response = await fetch('/api/customers', requestOptions);
  
      if (response.ok) {
        mutate('/api/customers');

        {/* reset input fields so users can add more customers */}
        setFirstName('');
        setLastName('');
        setEmail('');
        setBusinessName('');

        showSnackbar('Customer added successfully');
      } else {
        throw new Error("Failed to add customer");
      }
    } catch (error) {
      console.error('Error: ', error);
      showSnackbar('Failed to add customer');
    }
  }

  return(
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Add Customer</DialogTitle>

      {/* required input fields */}
      <Box 
        sx ={{ 
          px: "1.5rem",
          display: "flex", 
          justifyContent: "space-evenly", 
          alignItems: "center",
          gap: "0.5rem",
      }}>
        <InputField id="first-name" label="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        <InputField id="last-name" label="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
        <InputField id="business-name" label="Business Name" value={businessName} onChange={(e) => setBusinessName(e.target.value)} required={false} />
      </Box>

      {/* optional input field */}
      <Box sx={{ px: "1.5rem" }}>
        <InputField id="email" label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </Box>

      {/* buttons */}
      <Box sx={{ pt: "2rem" }}>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">Create</Button>
        </DialogActions>
      </Box>

      {/* Snackbar to show success or error messages */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2000}
        onClose={handleSnackbarClose}
        message={snackbarMessage}
      />
    </Dialog>
  )
}

/* Component: CreateCustomerHeader
* Creates a header that displays the number of customers and a button to add new customers
* 
* @param data: Customer[]: array of customers to gather the number of customers
*/
const CreateCustomerHeader = ({ data }: { data: Customer[] }) => {
  {"Manage state for dialog"}
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return(
    <Box 
      sx ={{ 
        padding: "1rem",
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
    }}>
        {/* display number of customers */}
        <Typography variant="h6">
          {`${data.length} Customers`}
        </Typography>

        {/* button to add new customer */}
        <Button
          variant="contained"
          startIcon={<AddRounded />}
          onClick={handleOpen}
        >
          Add Customer
        </Button>
        
        <CreateDialog open={open} handleClose={handleClose} />
    </Box>
  )
}

/* Component: CreateTable
* Creates a table that displays each customer's name and email
* 
* @param data: Customer[]: array of customers to display in the table
*/
const CreateTable = ({ data }: { data: Customer[] }) => {
  return(
    <Table>
      <TableHead>
        <TableRow>
          <TableCell><b>Name</b></TableCell>
          <TableCell><b>Email</b></TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {data.map((customer) => (
          <TableRow key={customer.email}>
            <TableCell>{`${customer.firstName} ${customer.lastName}`}</TableCell>
            <TableCell>{customer.email}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

/* Component: Home
* Creates the main page that displays the customers
*/
const Home = () => {
  // SWR is a great library for geting data, but is not really a solution
  // for POST requests. You'll want to use either another library or
  // the Fetch API for adding new customers.
  const fetcher = async (url: string) => {
    const response = await fetch(url);
    const body = await response.json();
    if (!response.ok) throw body;
    return body;
  };
  const { data, error, isLoading } = useSWR<Customers, ApiError>(
    '/api/customers',
    fetcher
  );

  return (
    <>
      <Head>
        <title>Dwolla | Customers</title>
      </Head>
      <main>
        <Box>
          {isLoading && <p>Loading...</p>}
          {error && <p>Error: {error.message}</p>}
          {data && (
            <>
              <Box 
                sx={{ 
                  py: "1rem",
                  px: "10rem",
                  justifyContent: "center", 
                  alignItems: "center",
                }}>
                <CreateCustomerHeader data={data} />
                <CreateTable data={data} />
              </Box>
            </>
          )}
        </Box>
      </main>
    </>
  );
};

export default Home;
