import { Box } from '@chakra-ui/react'
import PageHeader from '../components/PageHeader'
import PageContainer from '../components/PageContainer'
import Card from '../components/Card'

function MakeCalls() {
  return (
    <PageContainer>
      <PageHeader 
        title="Make Calls"
        description="Connect with your leads through calls"
      />
      
      <Card>
        {/* Calls content */}
      </Card>
    </PageContainer>
  )
}

export default MakeCalls 