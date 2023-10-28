import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, FlatList, Dimensions, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';
import XLSX from 'xlsx';
import { Alert } from 'react-native';

export default function App() {
  const rows = 10;
  const columns = 5;
  const initialGridData = Array.from({ length: rows }, () => Array(columns).fill(''));

  const [gridData, setGridData] = useState(initialGridData);

  useEffect(() => {
    async function loadGridData() {
      try {
        const savedGridData = await AsyncStorage.getItem('gridData');
        if (savedGridData) {
          setGridData(JSON.parse(savedGridData));
        }
      } catch (error) {
        console.error('Error loading data from AsyncStorage:', error);
      }
    }
    loadGridData();
  }, []);

  useEffect(() => {
    async function saveGridData() {
      try {
        await AsyncStorage.setItem('gridData', JSON.stringify(gridData));
      } catch (error) {
        console.error('Error saving data to AsyncStorage:', error);
      }
    }
    saveGridData();
  }, [gridData]);

  const handleInputChange = (rowIndex: number, columnIndex: number, text: string) => {
    const updatedGridData = [...gridData];
    updatedGridData[rowIndex][columnIndex] = text;
    setGridData(updatedGridData);
  };

  const exportToExcel = async () => {
    const workbook = XLSX.utils.book_new();
    const sheetData = gridData.map((row) => row.map((cell) => cell));
    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    XLSX.utils.book_append_sheet(workbook, ws, 'Sheet1');
    const excelData = XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' });
      
    const outputPath = `${RNFS.DownloadDirectoryPath}/${"Untitled1.xlsx"}`;
    
    try {
      await RNFS.writeFile(outputPath, excelData, 'base64');
      Alert.alert(`Excel file saved to ${outputPath}`);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      Alert.alert('Export Failed', 'There was an error exporting the file.');
    }
  };

  const confirmExportToExcel = () => {
    Alert.alert(
      'Confirm Export',
      'Are you sure you want to export to Excel?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Export',
          onPress: exportToExcel,
        },
      ]
    );
  };

  const windowWidth = Dimensions.get('window').width;
  const cellWidth = windowWidth/(columns+1);
  const cellHeight = 40; 

  const [selectedCell, setSelectedCell] = useState({ row: -1, col: -1 });

  const first_column_style = {
    borderWidth: 1, 
    width: 50, 
    height: cellHeight, 
    textAlign: 'center', 
    color: 'black'
  };

  const cell_style = {
    flex: 1,
    width: cellWidth,
    height: cellHeight,
    paddingHorizontal: 5,
    color: 'black',
    borderWidth: 1, 
    textAlign: 'center', 
  };

  return (
    <View style={{backgroundColor: 'white'}}>
      <View 
        style={{
          backgroundColor: 'lightblue',
          padding: 10,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Google Sheets Clone</Text>
        <Button title="Export" onPress={confirmExportToExcel} />
      </View>
      <View style={{ flexDirection: 'row' }}>
        <Text style={first_column_style}>
          {' '}
        </Text>
        {[...Array(columns).keys()].map((colIndex) => (
          <Text 
            key={`header_${colIndex}`} 
            style={{
              ...cell_style,
              paddingVertical: 10,
              backgroundColor: selectedCell.col === colIndex ? "#CCFFFF" : 'white' 
            }}
          >
            {String.fromCharCode(65 + colIndex)} 
          </Text>
        ))}
      </View>
      <FlatList
        data={[...gridData]}
        keyExtractor={(_, index) => `row_${index}`}
        renderItem={({ item, index: rowIndex }) => (
          <View style={{ flexDirection: 'row' }}>
            <Text style={{
              ...first_column_style,
              paddingVertical: 10,
              backgroundColor: selectedCell.row === rowIndex ? "#CCFFFF" : 'white'
              }}>
              {rowIndex+1} 
            </Text>
            {item.map((cell, colIndex) => (
              <TextInput
                key={`cell_${rowIndex}_${colIndex}`}
                value={cell}
                onChangeText={(text) => handleInputChange(rowIndex, colIndex, text)}
                onBlur={() => {
                  const updatedGridData = [...gridData];
                  if (!isNaN(cell)) {
                    updatedGridData[rowIndex][colIndex] = cell;
                  } else {
                    updatedGridData[rowIndex][colIndex] = cell;
                  }
                  setGridData(updatedGridData);
                }}
                style={{
                  ...cell_style,
                  borderWidth: selectedCell.row === rowIndex && selectedCell.col === colIndex ? 2 : 1,
                  textAlign: isNaN(cell) ? 'right' : 'left',
                  borderColor: selectedCell.row === rowIndex && selectedCell.col === colIndex ? 'blue' : 'black',
                }}
                onFocus={() => {
                  setSelectedCell({ row: rowIndex, col: colIndex });
                }}
              />
            ))}
          </View>
        )}
      />
    </View>
  );

}
