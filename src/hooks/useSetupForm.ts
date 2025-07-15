import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/hooks/use-toast';
import {
  parsePeopleCSV,
  parseProjectsCSV,
  parseRolesCSV,
} from '@/utils/csvUtils';

export const useSetupForm = () => {
  const {
    setConfig,
    setIsSetupComplete,
    setRunWorkCategories,
    setPeople,
    setTeams,
    setProjects,
    setRoles,
  } = useApp();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Initialize with default financial year start as April 1st of current year
  const currentYear = new Date().getFullYear();
  const defaultStartDate = `${currentYear}-04-01`;

  const [formData, setFormData] = useState({
    financialYearStart: defaultStartDate,
    financialYearEnd: `${currentYear + 1}-03-31`, // Auto-calculated
    iterationLength: 'fortnightly' as 'fortnightly' | 'monthly' | '6-weekly',
  });

  const [roleRates, setRoleRates] = useState<{ [roleId: string]: number }>({});

  const handleCSVUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    type: string
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target?.result as string;

      try {
        switch (type) {
          case 'People': {
            const { people, teams } = parsePeopleCSV(text);
            setPeople(people);
            setTeams(teams);
            toast({
              title: 'Import Successful',
              description: `Imported ${people.length} people and ${teams.length} teams`,
            });
            break;
          }
          case 'Projects': {
            const projects = parseProjectsCSV(text);
            setProjects(projects);
            toast({
              title: 'Import Successful',
              description: `Imported ${projects.length} projects`,
            });
            break;
          }
          case 'Roles': {
            const roles = parseRolesCSV(text);
            setRoles(roles);
            toast({
              title: 'Import Successful',
              description: `Imported ${roles.length} roles`,
            });
            break;
          }
        }
      } catch (error) {
        console.error('CSV parsing error:', error);
        toast({
          title: 'Import Error',
          description: `Failed to parse ${type} CSV. Please check the format.`,
          variant: 'destructive',
        });
      }
    };
    reader.readAsText(file);
  };

  const completeSetup = () => {
    console.log('Starting setup completion...');
    console.log('Form data:', formData);
    console.log('Role rates:', roleRates);

    // Validate required fields
    if (!formData.financialYearStart || !formData.financialYearEnd) {
      toast({
        title: 'Configuration Required',
        description:
          'Please set the financial year dates before completing setup.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Create default run work categories
      const defaultRunWorkCategories = [
        {
          id: 'run-1',
          name: 'Production Support',
          description: 'Ongoing production support work',
          color: '#ef4444',
        },
        {
          id: 'run-2',
          name: 'Certificate Management',
          description: 'SSL/TLS certificate management',
          color: '#f97316',
        },
        {
          id: 'run-3',
          name: 'Compliance',
          description: 'Regulatory compliance work',
          color: '#eab308',
        },
        {
          id: 'run-4',
          name: 'Technical Debt',
          description: 'Technical debt reduction',
          color: '#22c55e',
        },
      ];

      // Create basic configuration with proper structure
      const startDate = new Date(formData.financialYearStart);
      if (isNaN(startDate.getTime())) {
        throw new Error(
          `Invalid financial year start date: ${formData.financialYearStart}`
        );
      }
      const startYear = startDate.getFullYear();
      const config = {
        financialYear: {
          id: `fy-${startYear}`,
          name: `FY ${startYear}`,
          startDate: formData.financialYearStart,
          endDate: formData.financialYearEnd,
        },
        iterationLength: formData.iterationLength,
        quarters: [], // Will be populated later when quarters are created
      };

      console.log('Setting configuration:', config);
      console.log('Setting run work categories:', defaultRunWorkCategories);

      // Set all the data in the context
      setConfig(config);
      setRunWorkCategories(defaultRunWorkCategories);

      // Mark setup as complete
      setIsSetupComplete(true);

      console.log('Setup completion successful');

      toast({
        title: 'Setup Complete',
        description: 'Your planning app is now ready to use!',
      });

      // Wait for state to be persisted before navigation
      // Use requestAnimationFrame to ensure all state updates are flushed
      requestAnimationFrame(() => {
        setTimeout(() => {
          console.log('Setup process finished, navigating to dashboard');
          navigate('/dashboard');
        }, 2000); // Extended delay for localStorage persistence
      });
    } catch (error) {
      console.error('Setup completion error:', error);
      toast({
        title: 'Setup Error',
        description:
          'There was an error completing the setup. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return {
    formData,
    setFormData,
    roleRates,
    setRoleRates,
    handleCSVUpload,
    completeSetup,
  };
};
