import React from 'react'
import { Route, Routes } from 'react-router-dom'
import Login from './pages/auth/Login'
import Home from './pages/PlatformAdmin/Home'
import ProtectedRoute from './protectedRoute/ProtectedRoute'
import HomeAdmin from './pages/Admin/Home'
import UsersAdmin from './pages/Admin/Users'
import InviteUser from './pages/Admin/Invite_User'
import Speciality from './pages/Admin/Speciality'
import Teams from './pages/Admin/Teams'
import CreateOrganization from './pages/PlatformAdmin/Create_Organization'
import ViewOrganization from './pages/PlatformAdmin/View_organization'
import AcceptInvitation from './pages/users/Accept_Invitation'
import Invitations from './pages/PlatformAdmin/Invitations'
import Users from './pages/PlatformAdmin/Users'

const App = () => {
  return (
    <>
      <Routes>
        <Route path='/' element={<Login />} />
        <Route
          path="/accept-invitation"
          element={<AcceptInvitation />}
        />
        <Route element={<ProtectedRoute allowedRoles={["PLATFORM_ADMIN"]} />}>
          <Route
            path="/platform/organizations"
            element={<Home />}
          />
          <Route
            path="/platform/organizations/create"
            element={<CreateOrganization />}
          />
          <Route
            path="/platform/organizations/:id"
            element={<ViewOrganization />}
          />
          <Route
            path="/platform/invitations"
            element={<Invitations />}
          />
          <Route
            path="/platform/users"
            element={<Users />}
          />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["ORGANIZATION_ADMIN"]} />}>
          <Route
            path="/Home"
            element={<HomeAdmin />}
          />
          <Route
            path="/home/users"
            element={<UsersAdmin />}
          />
          <Route
            path="/home/users/invite"
            element={<InviteUser />}
          />
          <Route
            path="/home/speciality"
            element={<Speciality />}
          />
          <Route
            path="/home/teams"
            element={<Teams />}
          />
        </Route>
      </Routes>
    </>
  )
}

export default App
